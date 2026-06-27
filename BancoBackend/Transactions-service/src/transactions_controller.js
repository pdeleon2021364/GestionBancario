import mongoose from 'mongoose';
import axios from 'axios';
import { randomUUID } from 'crypto';

import Transaction from './transactions_model.js';
import BankAccount from '../bankAccount/bankAccount_model.js';

const notificationServiceClient = {
    sendEmail: async (to, subject, tipo, monto, saldo) => {
        if (!to) {
            throw new Error('No email address provided to Notification Service');
        }

        const response = await axios.post('http://localhost:3010/notification/v1/notify/email', {
            to,
            subject,
            tipo,
            monto,
            saldo
        });
        return response.data;
    }
};

const recordServiceClient = {
    createRecord: async (recordData) => {
        try {
            const response = await axios.post('http://localhost:3009/record/v1/record', recordData);
            return response.data;
        } catch (error) {
            console.warn('Record Service unavailable:', error.message);
            return null;
        }
    }
};

const getAccountEmail = (account) => {
    return account?.usuarioEmail || account?.email || account?.correo || null;
};

const sendTransactionNotification = async (email, subject, tipo, monto, saldo) => {
    if (!email) {
        console.warn(`Skipping email notification because account email is not configured for ${subject}`);
        return null;
    }
    try {
        return await notificationServiceClient.sendEmail(email, subject, tipo, monto, saldo);
    } catch (error) {
        console.warn('Notification Service error:', error.message);
        return null;
    }
};

const createRecordIfAvailable = async (recordData) => {
    return await recordServiceClient.createRecord(recordData);
};

const MIN_TRANSACTION_AMOUNT = 0.01;
const MAX_TRANSACTION_AMOUNT = 50000;
const DAILY_TRANSACTION_LIMIT = 100000;
const MONEY_MOVEMENT_TYPES = ['deposito', 'retiro', 'transferencia'];

const getAuditData = (req) => ({
    usuarioId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    canal: req.get('x-channel') || 'api',
    referencia: randomUUID(),
    idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey
});

const validateAmount = (monto) => {
    const amount = Number(monto);
    if (!Number.isFinite(amount) || amount < MIN_TRANSACTION_AMOUNT) {
        throw new Error('El monto debe ser mayor que 0');
    }
    if (amount > MAX_TRANSACTION_AMOUNT) {
        throw new Error(`El monto no puede exceder ${MAX_TRANSACTION_AMOUNT}`);
    }
    return amount;
};

const validateDailyLimit = async (usuarioId, amount, session) => {
    if (!usuarioId) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [result] = await Transaction.aggregate([
        {
            $match: {
                usuarioId: String(usuarioId),
                tipo: { $in: ['retiro', 'transferencia'] },
                estado: 'completado',
                createdAt: { $gte: startOfDay }
            }
        },
        { $group: { _id: null, total: { $sum: '$monto' } } }
    ]).session(session);

    if ((result?.total || 0) + amount > DAILY_TRANSACTION_LIMIT) {
        throw new Error('Límite diario de transacciones excedido');
    }
};

export const createTransaction = async (req, res) => {
    try {
        const { tipo, monto, cuentaOrigen, cuentaDestino } = req.body;
        const amount = validateAmount(monto);
        const auditData = getAuditData(req);

        if (!tipo || monto === undefined) {
            throw new Error('Tipo y monto son obligatorios');
        }

        if (!MONEY_MOVEMENT_TYPES.includes(tipo)) {
            throw new Error('Tipo de transacción inválido');
        }

        if (auditData.idempotencyKey) {
            const existingTransaction = await Transaction.findOne({
                idempotencyKey: auditData.idempotencyKey,
                usuarioId: String(req.user?.id)
            });

            if (existingTransaction) {
                return res.status(200).json({
                    success: true,
                    message: 'Transacción ya procesada previamente',
                    data: existingTransaction
                });
            }
        }

        if (tipo === 'deposito' && !['ADMIN_ROLE', 'CAJERO_ROLE'].includes(req.user?.role)) {
            throw new Error('No tienes permiso para realizar depósitos directos');
        }

        if (tipo === 'deposito') {
            if (!cuentaDestino) {
                throw new Error('Debe proporcionar cuentaDestino para depósito');
            }

            const session = await mongoose.startSession();
            let cuenta;
            let transaction;

            try {
                await session.withTransaction(async () => {
                    cuenta = await BankAccount.findById(cuentaDestino).session(session);
                    if (!cuenta) throw new Error('Cuenta destino no encontrada');
                    if (cuenta.estado !== 'activa') throw new Error('Cuenta destino no está activa');

                    cuenta.saldo += amount;
                    await cuenta.save({ session });

                    const [createdTransaction] = await Transaction.create([{
                        tipo,
                        monto: amount,
                        cuentaDestino,
                        ...auditData,
                        usuarioId: String(req.user?.id),
                        descripcion: `Depósito de ${amount}`
                    }], { session });

                    transaction = createdTransaction;
                });
            } finally {
                await session.endSession();
            }

            await sendTransactionNotification(
                getAccountEmail(cuenta),
                'Depósito realizado',
                tipo,
                amount,
                cuenta.saldo
            );

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Depósito de ${amount}`,
                usuarioId: cuenta.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: amount,
                    cuentaDestino: cuentaDestino.toString(),
                    saldo: cuenta.saldo,
                    referencia: transaction.referencia
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Depósito realizado correctamente',
                data: transaction
            });
        }

        if (tipo === 'retiro') {
            if (!cuentaOrigen) {
                throw new Error('Debe proporcionar cuentaOrigen para retiro');
            }

            const session = await mongoose.startSession();
            let cuenta;
            let transaction;

            try {
                await session.withTransaction(async () => {
                    cuenta = await BankAccount.findById(cuentaOrigen).session(session);
                    if (!cuenta) throw new Error('Cuenta origen no encontrada');
                    if (cuenta.estado !== 'activa') throw new Error('Cuenta origen no está activa');

                    if (req.user?.role !== 'ADMIN_ROLE') {
                        const ownerCheck = String(cuenta.usuarioId) === String(req.user?.id);
                        if (!ownerCheck) {
                            throw new Error('No tienes permiso para operar con esa cuenta de origen');
                        }
                    }

                    if (cuenta.saldo < amount) {
                        throw new Error('Saldo insuficiente');
                    }

                    await validateDailyLimit(req.user?.id, amount, session);

                    cuenta.saldo -= amount;
                    await cuenta.save({ session });

                    const [createdTransaction] = await Transaction.create([{
                        tipo,
                        monto: amount,
                        cuentaOrigen,
                        ...auditData,
                        usuarioId: String(req.user?.id),
                        descripcion: `Retiro de ${amount}`
                    }], { session });

                    transaction = createdTransaction;
                });
            } finally {
                await session.endSession();
            }

            await sendTransactionNotification(
                getAccountEmail(cuenta),
                'Retiro realizado',
                tipo,
                amount,
                cuenta.saldo
            );

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Retiro de ${amount}`,
                usuarioId: cuenta.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: amount,
                    cuentaOrigen: cuentaOrigen.toString(),
                    saldo: cuenta.saldo,
                    referencia: transaction.referencia
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Retiro realizado correctamente',
                data: transaction
            });
        }

        if (tipo === 'transferencia') {
            if (!cuentaOrigen || !cuentaDestino) {
                throw new Error('Debe proporcionar cuentaOrigen y cuentaDestino para transferencia');
            }

            if (cuentaOrigen === cuentaDestino) {
                throw new Error('No puede transferir a la misma cuenta');
            }

            const session = await mongoose.startSession();
            let cuentaO;
            let cuentaD;
            let transaction;

            try {
                await session.withTransaction(async () => {
                    cuentaO = await BankAccount.findById(cuentaOrigen).session(session);
                    cuentaD = await BankAccount.findById(cuentaDestino).session(session);

                    if (!cuentaO) throw new Error('Cuenta origen no encontrada');
                    if (!cuentaD) throw new Error('Cuenta destino no encontrada');
                    if (cuentaO.estado !== 'activa' || cuentaD.estado !== 'activa') {
                        throw new Error('Ambas cuentas deben estar activas para realizar la transferencia');
                    }

                    if (req.user?.role !== 'ADMIN_ROLE') {
                        const ownerCheck = String(cuentaO.usuarioId) === String(req.user?.id);
                        if (!ownerCheck) {
                            throw new Error('No tienes permiso para transferir desde esa cuenta de origen');
                        }
                    }

                    if (cuentaO.saldo < amount) {
                        throw new Error('Saldo insuficiente');
                    }

                    await validateDailyLimit(req.user?.id, amount, session);

                    cuentaO.saldo -= amount;
                    cuentaD.saldo += amount;

                    await cuentaO.save({ session });
                    await cuentaD.save({ session });

                    const [createdTransaction] = await Transaction.create([{
                        tipo,
                        monto: amount,
                        cuentaOrigen,
                        cuentaDestino,
                        ...auditData,
                        usuarioId: String(req.user?.id),
                        descripcion: `Transferencia de ${amount}`
                    }], { session });

                    transaction = createdTransaction;
                });
            } finally {
                await session.endSession();
            }

            await sendTransactionNotification(
                getAccountEmail(cuentaO),
                'Transferencia enviada',
                tipo,
                amount,
                cuentaO.saldo
            );

            await sendTransactionNotification(
                getAccountEmail(cuentaD),
                'Transferencia recibida',
                tipo,
                amount,
                cuentaD.saldo
            );

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Transferencia enviada de ${amount}`,
                usuarioId: cuentaO.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: amount,
                    cuentaOrigen: cuentaOrigen.toString(),
                    cuentaDestino: cuentaDestino.toString(),
                    saldoOrigen: cuentaO.saldo,
                    referencia: transaction.referencia
                }
            });

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Transferencia recibida de ${amount}`,
                usuarioId: cuentaD.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: amount,
                    cuentaOrigen: cuentaOrigen.toString(),
                    cuentaDestino: cuentaDestino.toString(),
                    saldoDestino: cuentaD.saldo,
                    referencia: transaction.referencia
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Transferencia realizada correctamente',
                data: transaction
            });
        }

        throw new Error('Tipo de transacción inválido');
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, descripcion } = req.body;

        if (
            req.body.tipo !== undefined ||
            req.body.monto !== undefined ||
            req.body.cuentaOrigen !== undefined ||
            req.body.cuentaDestino !== undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'No se permite modificar campos financieros de una transacción. Usa un proceso de reversión.'
            });
        }

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        if (estado !== undefined) {
            transaction.estado = estado;
        }
        if (descripcion !== undefined) {
            transaction.descripcion = descripcion;
        }
        if (!transaction.referencia) {
            transaction.referencia = randomUUID();
        }

        await transaction.save();

        // Create record for the update in Record Service
        await recordServiceClient.createRecord({
            tipo: 'transaccion_actualizada',
            entidad: 'Transaction',
            entidadId: transaction._id,
            descripcion: `Metadatos de transacción actualizados`,
            usuarioId: req.user?.id || 'system',
            datos: {
                estado: transaction.estado,
                descripcion: transaction.descripcion,
                referencia: transaction.referencia
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Transacción actualizada correctamente',
            data: transaction
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findById(id)
            .populate('cuentaOrigen cuentaDestino');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la transacción',
            error: error.message
        });
    }
};

export const getTransactionByTipo = async (req, res) => {
    try {
        const { tipo } = req.params;

        if (!tipo) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el tipo de transacción'
            });
        }

        const transaction = await Transaction.find({
            tipo: { $regex: tipo, $options: 'i' }
        }).populate('cuentaOrigen cuentaDestino');

        if (!transaction.length) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la transacción',
            error: error.message
        });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTransaction = await Transaction.findByIdAndUpdate(
            id,
            {
                estado: 'cancelado',
                descripcion: 'Cancelación administrativa sin movimiento de saldo'
            },
            { new: true, runValidators: true }
        );

        if (!deletedTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        // Create record for deletion in Record Service
        await recordServiceClient.createRecord({
            tipo: 'transaccion_eliminada',
            entidad: 'Transaction',
            entidadId: id,
            descripcion: `Transacción cancelada`,
            usuarioId: req.user?.id || 'system',
            datos: {
                transactionId: id,
                referencia: deletedTransaction.referencia
            }
        });

        res.status(200).json({
            success: true,
            message: 'Transacción cancelada correctamente',
            data: deletedTransaction
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al eliminar la transacción',
            error: error.message
        });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        let filter = {};
        if (req.user?.role !== 'ADMIN_ROLE') {
            const userAccounts = await BankAccount.find({ usuarioId: String(req.user?.id) }).select('_id');
            const accountIds = userAccounts.map(a => a._id);
            filter = {
                $or: [
                    { cuentaOrigen: { $in: accountIds } },
                    { cuentaDestino: { $in: accountIds } }
                ]
            };
        }

        const transactions = await Transaction.find(filter)
            .populate('cuentaOrigen cuentaDestino')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las transacciones',
            error: error.message
        });
    }
};

export const getMyTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, tipo, fechaInicio, fechaFin } = req.query;

        const cuentas = await BankAccount.find({ usuarioId: String(req.user.id) }).select('_id');
        const cuentaIds = cuentas.map(c => c._id);

        const filter = {
            $or: [
                { cuentaOrigen: { $in: cuentaIds } },
                { cuentaDestino: { $in: cuentaIds } }
            ]
        };

        if (tipo) filter.tipo = tipo;
        if (fechaInicio || fechaFin) {
            filter.createdAt = {};
            if (fechaInicio) filter.createdAt.$gte = new Date(fechaInicio);
            if (fechaFin) filter.createdAt.$lte = new Date(fechaFin);
        }

        const transactions = await Transaction.find(filter)
            .populate('cuentaOrigen cuentaDestino')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener tus transacciones',
            error: error.message
        });
    }
};
