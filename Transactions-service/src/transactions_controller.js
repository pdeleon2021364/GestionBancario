import mongoose from 'mongoose';
import axios from 'axios';

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

export const createTransaction = async (req, res) => {
    try {
        const { tipo, monto, cuentaOrigen, cuentaDestino } = req.body;

        if (!tipo || monto === undefined) {
            throw new Error('Tipo y monto son obligatorios');
        }

        if (Number(monto) <= 0) {
            throw new Error('El monto debe ser mayor que 0');
        }

        if (tipo === 'deposito') {
            if (!cuentaDestino) {
                throw new Error('Debe proporcionar cuentaDestino para depósito');
            }

            const cuenta = await BankAccount.findById(cuentaDestino);
            if (!cuenta) throw new Error('Cuenta destino no encontrada');
            if (cuenta.estado !== 'activa') throw new Error('Cuenta destino no está activa');

            cuenta.saldo += Number(monto);
            await cuenta.save();

            const transaction = await Transaction.create({
                tipo,
                monto: Number(monto),
                cuentaDestino
            });

            await sendTransactionNotification(
                getAccountEmail(cuenta),
                'Depósito realizado',
                tipo,
                Number(monto),
                cuenta.saldo
            );

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Depósito de ${monto}`,
                usuarioId: cuenta.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: Number(monto),
                    cuentaDestino: cuentaDestino.toString(),
                    saldo: cuenta.saldo
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

            const cuenta = await BankAccount.findById(cuentaOrigen);
            if (!cuenta) throw new Error('Cuenta origen no encontrada');
            if (cuenta.estado !== 'activa') throw new Error('Cuenta origen no está activa');

            if (cuenta.saldo < Number(monto)) {
                throw new Error('Saldo insuficiente');
            }

            cuenta.saldo -= Number(monto);
            await cuenta.save();

            const transaction = await Transaction.create({
                tipo,
                monto: Number(monto),
                cuentaOrigen
            });

            await sendTransactionNotification(
                getAccountEmail(cuenta),
                'Retiro realizado',
                tipo,
                Number(monto),
                cuenta.saldo
            );

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Retiro de ${monto}`,
                usuarioId: cuenta.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: Number(monto),
                    cuentaOrigen: cuentaOrigen.toString(),
                    saldo: cuenta.saldo
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

            const cuentaO = await BankAccount.findById(cuentaOrigen);
            const cuentaD = await BankAccount.findById(cuentaDestino);

            if (!cuentaO) throw new Error('Cuenta origen no encontrada');
            if (!cuentaD) throw new Error('Cuenta destino no encontrada');
            if (cuentaO.estado !== 'activa' || cuentaD.estado !== 'activa') {
                throw new Error('Ambas cuentas deben estar activas para realizar la transferencia');
            }

            if (cuentaO.saldo < Number(monto)) {
                throw new Error('Saldo insuficiente');
            }

            cuentaO.saldo -= Number(monto);
            cuentaD.saldo += Number(monto);

            await cuentaO.save();
            await cuentaD.save();

            const transaction = await Transaction.create({
                tipo,
                monto: Number(monto),
                cuentaOrigen,
                cuentaDestino
            });

            await sendTransactionNotification(
                getAccountEmail(cuentaO),
                'Transferencia enviada',
                tipo,
                Number(monto),
                cuentaO.saldo
            );

            await sendTransactionNotification(
                getAccountEmail(cuentaD),
                'Transferencia recibida',
                tipo,
                Number(monto),
                cuentaD.saldo
            );

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Transferencia enviada de ${monto}`,
                usuarioId: cuentaO.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: Number(monto),
                    cuentaOrigen: cuentaOrigen.toString(),
                    cuentaDestino: cuentaDestino.toString(),
                    saldoOrigen: cuentaO.saldo
                }
            });

            await createRecordIfAvailable({
                tipo: 'transaccion',
                entidad: 'Transaction',
                entidadId: transaction._id,
                descripcion: `Transferencia recibida de ${monto}`,
                usuarioId: cuentaD.usuarioId?.toString() || 'system',
                datos: {
                    tipo,
                    monto: Number(monto),
                    cuentaOrigen: cuentaOrigen.toString(),
                    cuentaDestino: cuentaDestino.toString(),
                    saldoDestino: cuentaD.saldo
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
        const { tipo, monto } = req.body;

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        // =========================
        // REVERTIR EFECTO ANTERIOR
        // =========================

        if (transaction.tipo === 'deposito') {
            const cuenta = await BankAccount.findById(transaction.cuentaDestino);
            cuenta.saldo -= transaction.monto;
            await cuenta.save();
        }

        if (transaction.tipo === 'retiro') {
            const cuenta = await BankAccount.findById(transaction.cuentaOrigen);
            cuenta.saldo += transaction.monto;
            await cuenta.save();
        }

        if (transaction.tipo === 'transferencia') {
            const cuentaO = await BankAccount.findById(transaction.cuentaOrigen);
            const cuentaD = await BankAccount.findById(transaction.cuentaDestino);

            cuentaO.saldo += transaction.monto;
            cuentaD.saldo -= transaction.monto;

            await cuentaO.save();
            await cuentaD.save();
        }

        // =========================
        //  APLICAR NUEVA OPERACIÓN
        // =========================

        transaction.tipo = tipo || transaction.tipo;
        transaction.monto = monto || transaction.monto;

        if (transaction.monto <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }

        if (transaction.tipo === 'deposito') {
            const cuenta = await BankAccount.findById(transaction.cuentaDestino);
            cuenta.saldo += transaction.monto;
            await cuenta.save();
        }

        if (transaction.tipo === 'retiro') {
            const cuenta = await BankAccount.findById(transaction.cuentaOrigen);

            if (cuenta.saldo < transaction.monto) {
                throw new Error('Saldo insuficiente');
            }

            cuenta.saldo -= transaction.monto;
            await cuenta.save();
        }

        if (transaction.tipo === 'transferencia') {
            const cuentaO = await BankAccount.findById(transaction.cuentaOrigen);
            const cuentaD = await BankAccount.findById(transaction.cuentaDestino);

            if (cuentaO.saldo < transaction.monto) {
                throw new Error('Saldo insuficiente');
            }

            cuentaO.saldo -= transaction.monto;
            cuentaD.saldo += transaction.monto;

            await cuentaO.save();
            await cuentaD.save();
        }

        await transaction.save();

        // Create record for the update in Record Service
        await recordServiceClient.createRecord({
            tipo: 'transaccion_actualizada',
            entidad: 'Transaction',
            entidadId: transaction._id,
            descripcion: `Transacción actualizada a ${tipo} de ${monto}`,
            usuarioId: 'system', // In a real app, this would come from JWT
            datos: {
                tipoAnterior: transaction.tipo,
                montoAnterior: transaction.monto,
                tipoNuevo: tipo,
                montoNuevo: monto
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

        const transaction = await Transaction.findOne({
            tipo: { $regex: tipo, $options: 'i' }
        }).populate('cuentaOrigen cuentaDestino');

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

export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTransaction = await Transaction.findByIdAndDelete(id);

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
            descripcion: `Transacción eliminada`,
            usuarioId: 'system', // In a real app, this would come from JWT
            datos: {
                transactionId: id
            }
        });

        res.status(200).json({
            success: true,
            message: 'Transacción eliminada correctamente'
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

        const transactions = await Transaction.find()
            .populate('cuentaOrigen cuentaDestino')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments();

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