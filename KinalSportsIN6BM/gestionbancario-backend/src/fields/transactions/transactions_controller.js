import { randomUUID } from 'crypto';

import Transaction from './transactions_model.js';
import BankAccount from '../bankAccount/bankAccount_model.js';
import User from '../Usuarios/usuarios.model.js';
import { sendEmail } from '../../../utils/sendEmail.js';
import { emailTemplate } from '../../../utils/emailTemplate.js';

const MIN_TRANSACTION_AMOUNT = 0.01;
const MAX_TRANSACTION_AMOUNT = 50000;
const DAILY_TRANSACTION_LIMIT = 100000;
const MONEY_MOVEMENT_TYPES = ['deposito', 'retiro', 'transferencia'];

const tryEmail = async (usuarioId, subject, templateData) => {
    try {
        const pkValue = Number.isNaN(Number(usuarioId)) ? usuarioId : Number(usuarioId);
        const usuario = await User.findByPk(pkValue);
        if (usuario?.email) {
            await sendEmail(usuario.email, subject, emailTemplate(templateData));
        }
    } catch (emailError) {
        console.warn('[Email] No se pudo enviar notificacion:', emailError.message);
    }
};

const getAuditData = (req) => ({
    usuarioId: String(req.user?.id || ''),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    canal: req.get('x-channel') || 'api',
    referencia: randomUUID(),
    idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey || randomUUID()
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

const validateDailyLimit = async (usuarioId, amount) => {
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
    ]);

    if ((result?.total || 0) + amount > DAILY_TRANSACTION_LIMIT) {
        throw new Error('Limite diario de transacciones excedido');
    }
};

const assertAccountOwner = (req, account) => {
    if (req.user?.role !== 'ADMIN_ROLE' && String(account.usuarioId) !== String(req.user?.id)) {
        throw new Error('No tienes permiso para operar con esta cuenta');
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
            throw new Error('Tipo de transaccion invalido. Use: deposito, retiro o transferencia');
        }

        if (auditData.idempotencyKey) {
            const existingTransaction = await Transaction.findOne({
                idempotencyKey: auditData.idempotencyKey,
                usuarioId: auditData.usuarioId
            });

            if (existingTransaction) {
                return res.status(200).json({
                    success: true,
                    message: 'Transaccion ya procesada previamente',
                    data: existingTransaction
                });
            }
        }

        if (tipo === 'deposito' && !['ADMIN_ROLE', 'CAJERO_ROLE'].includes(req.user?.role)) {
            throw new Error('No tienes permiso para realizar depositos directos');
        }

        let transaction;
        let cuenta;
        let cuentaO;
        let cuentaD;

        if (tipo === 'deposito') {
            if (!cuentaDestino) throw new Error('Debe proporcionar cuentaDestino para un deposito');

            cuenta = await BankAccount.findById(cuentaDestino);
            if (!cuenta) throw new Error('Cuenta destino no encontrada');
            if (cuenta.estado !== 'activa') throw new Error('Cuenta destino no esta activa');

            await BankAccount.findByIdAndUpdate(cuentaDestino, { $inc: { saldo: amount } });

            transaction = await Transaction.create({
                tipo,
                monto: amount,
                cuentaDestino,
                ...auditData,
                descripcion: `Deposito de ${amount}`
            });
        } else if (tipo === 'retiro') {
            if (!cuentaOrigen) throw new Error('Debe proporcionar cuentaOrigen para un retiro');

            cuenta = await BankAccount.findById(cuentaOrigen);
            if (!cuenta) throw new Error('Cuenta origen no encontrada');
            if (cuenta.estado !== 'activa') throw new Error('Cuenta origen no esta activa');

            assertAccountOwner(req, cuenta);
            if (cuenta.saldo < amount) throw new Error('Saldo insuficiente');

            await validateDailyLimit(req.user?.id, amount);

            const updated = await BankAccount.findOneAndUpdate(
                { _id: cuentaOrigen, saldo: { $gte: amount } },
                { $inc: { saldo: -amount } },
                { new: true }
            );
            if (!updated) throw new Error('Saldo insuficiente');

            transaction = await Transaction.create({
                tipo,
                monto: amount,
                cuentaOrigen,
                ...auditData,
                descripcion: `Retiro de ${amount}`
            });
        } else {
            if (!cuentaOrigen || !cuentaDestino) {
                throw new Error('Debe proporcionar cuentaOrigen y cuentaDestino');
            }

            if (cuentaOrigen === cuentaDestino) {
                throw new Error('No puede transferir a la misma cuenta');
            }

            cuentaO = await BankAccount.findById(cuentaOrigen);
            cuentaD = await BankAccount.findById(cuentaDestino);

            if (!cuentaO || !cuentaD) throw new Error('Una de las cuentas no existe');
            if (cuentaO.estado !== 'activa' || cuentaD.estado !== 'activa') {
                throw new Error('Ambas cuentas deben estar activas para realizar la transferencia');
            }

            assertAccountOwner(req, cuentaO);
            if (cuentaO.saldo < amount) throw new Error('Saldo insuficiente');

            await validateDailyLimit(req.user?.id, amount);

            const debited = await BankAccount.findOneAndUpdate(
                { _id: cuentaOrigen, saldo: { $gte: amount } },
                { $inc: { saldo: -amount } },
                { new: true }
            );
            if (!debited) throw new Error('Saldo insuficiente');

            try {
                await BankAccount.findByIdAndUpdate(cuentaDestino, { $inc: { saldo: amount } });
            } catch (err) {
                await BankAccount.findByIdAndUpdate(cuentaOrigen, { $inc: { saldo: amount } });
                throw new Error('Error al acreditar la cuenta destino, transferencia revertida');
            }

            transaction = await Transaction.create({
                tipo,
                monto: amount,
                cuentaOrigen,
                cuentaDestino,
                ...auditData,
                descripcion: `Transferencia de ${amount}`
            });
        }

        if (tipo === 'deposito') {
            await tryEmail(cuenta.usuarioId, 'Deposito realizado', {
                tipo,
                monto: amount,
                saldo: cuenta.saldo
            });
        }

        if (tipo === 'retiro') {
            await tryEmail(cuenta.usuarioId, 'Retiro realizado', {
                tipo,
                monto: amount,
                saldo: cuenta.saldo
            });
        }

        if (tipo === 'transferencia') {
            await tryEmail(cuentaO.usuarioId, 'Transferencia enviada', {
                tipo,
                monto: amount,
                saldo: cuentaO.saldo
            });
            await tryEmail(cuentaD.usuarioId, 'Transferencia recibida', {
                tipo,
                monto: amount,
                saldo: cuentaD.saldo
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Transaccion realizada correctamente',
            data: transaction
        });
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
                message: 'No se permite modificar campos financieros de una transaccion. Usa un proceso de reversion.'
            });
        }

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaccion no encontrada'
            });
        }

        if (estado !== undefined) transaction.estado = estado;
        if (descripcion !== undefined) transaction.descripcion = descripcion;
        if (!transaction.referencia) transaction.referencia = randomUUID();

        await transaction.save();

        return res.status(200).json({
            success: true,
            message: 'Transaccion actualizada correctamente',
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
                message: 'Transaccion no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al buscar la transaccion',
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
                message: 'Debe proporcionar el tipo de transaccion'
            });
        }

        const transaction = await Transaction.find({
            tipo: { $regex: tipo, $options: 'i' }
        }).populate('cuentaOrigen cuentaDestino');

        if (!transaction.length) {
            return res.status(404).json({
                success: false,
                message: 'Transaccion no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al buscar la transaccion',
            error: error.message
        });
    }
};

export const getMyTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, tipo, fechaInicio, fechaFin } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(10, Math.max(1, parseInt(limit, 10) || 10));

        const accounts = await BankAccount.find({ usuarioId: String(req.user.id) }).select('_id');
        const accountIds = accounts.map(account => account._id);

        const filter = {
            $or: [
                { cuentaOrigen: { $in: accountIds } },
                { cuentaDestino: { $in: accountIds } }
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
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
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

export const getTransactionsByAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { page = 1, limit = 10, tipo, fechaInicio, fechaFin } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(10, Math.max(1, parseInt(limit, 10) || 10));

        const account = await BankAccount.findById(accountId);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        if (req.user?.role !== 'ADMIN_ROLE' && String(account.usuarioId) !== String(req.user?.id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver las transacciones de esta cuenta'
            });
        }

        const filter = {
            $or: [
                { cuentaOrigen: account._id },
                { cuentaDestino: account._id }
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
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las transacciones de la cuenta',
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
                descripcion: 'Cancelacion administrativa sin movimiento de saldo'
            },
            { new: true, runValidators: true }
        );

        if (!deletedTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaccion no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Transaccion cancelada correctamente',
            data: deletedTransaction
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al cancelar la transaccion',
            error: error.message
        });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(10, Math.max(1, parseInt(limit, 10) || 10));

        let filter = {};
        if (req.user?.role !== 'ADMIN_ROLE' && req.user?.role !== 'AUDITOR_ROLE') {
            const userAccounts = await BankAccount.find({ usuarioId: String(req.user?.id) }).select('_id');
            const accountIds = userAccounts.map(account => account._id);
            filter = {
                $or: [
                    { cuentaOrigen: { $in: accountIds } },
                    { cuentaDestino: { $in: accountIds } }
                ]
            };
        }

        const transactions = await Transaction.find(filter)
            .populate('cuentaOrigen cuentaDestino')
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las transacciones',
            error: error.message
        });
    }
};
