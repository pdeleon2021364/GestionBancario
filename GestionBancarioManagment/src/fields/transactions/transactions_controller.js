import mongoose from 'mongoose';

import Transaction from './transactions_model.js';
import BankAccount from '../bankAccount/bankAccount_model.js';
import User from '../Usuarios/usuarios.model.js';
import { sendEmail } from '../../../utils/sendEmail.js';
import { emailTemplate } from '../../../utils/emailTemplate.js';

// ─── Helper: intentar enviar email sin romper la transacción ─────────────────
// El usuarioId en MongoDB puede ser un string con formato de .NET (ej: "usr_D268rRUTNkT6")
// que no es un integer válido para Sequelize/PostgreSQL.
// Si el correo falla por cualquier razón, la transacción ya se completó y no se revierte.
const tryEmail = async (usuarioId, subject, templateData) => {
    try {
        // Intentar parsear como número primero (usuarios creados desde Node)
        const pkValue = isNaN(Number(usuarioId)) ? usuarioId : Number(usuarioId);
        const usuario = await User.findByPk(pkValue);
        if (usuario?.email) {
            await sendEmail(usuario.email, subject, emailTemplate(templateData));
        }
    } catch (emailError) {
        // El correo falla silenciosamente — la transacción ya fue guardada
        console.warn('[Email] No se pudo enviar notificación:', emailError.message);
    }
};

export const createTransaction = async (req, res) => {

    try {
        const { tipo, monto, cuentaOrigen, cuentaDestino } = req.body;

        if (!tipo || !monto) {
            throw new Error('Tipo y monto son obligatorios');
        }

        if (monto <= 0) {
            throw new Error('El monto debe ser mayor que 0');
        }

        // =========================
        // 🔹 DEPÓSITO
        // =========================
        if (tipo === 'deposito') {

            if (!cuentaDestino) throw new Error('Debe proporcionar cuentaDestino para un depósito');

            const cuenta = await BankAccount.findById(cuentaDestino);
            if (!cuenta) throw new Error('Cuenta destino no encontrada');

            cuenta.saldo += monto;
            await cuenta.save();

            const transaction = await Transaction.create({
                tipo,
                monto,
                cuentaDestino
            });

            // Correo: falla silenciosamente si el usuarioId no es un integer de Postgres
            await tryEmail(cuenta.usuarioId, 'Depósito realizado', {
                tipo: 'deposito',
                monto,
                saldo: cuenta.saldo
            });

            return res.status(201).json({
                success: true,
                message: 'Depósito realizado correctamente',
                data: transaction
            });
        }

        // =========================
        // 🔹 RETIRO
        // =========================
        if (tipo === 'retiro') {

            if (!cuentaOrigen) throw new Error('Debe proporcionar cuentaOrigen para un retiro');

            const cuenta = await BankAccount.findById(cuentaOrigen);
            if (!cuenta) throw new Error('Cuenta origen no encontrada');

            if (cuenta.saldo < monto) {
                throw new Error('Saldo insuficiente');
            }

            cuenta.saldo -= monto;
            await cuenta.save();

            const transaction = await Transaction.create({
                tipo,
                monto,
                cuentaOrigen
            });

            await tryEmail(cuenta.usuarioId, 'Retiro realizado', {
                tipo: 'retiro',
                monto,
                saldo: cuenta.saldo
            });

            return res.status(201).json({
                success: true,
                message: 'Retiro realizado correctamente',
                data: transaction
            });
        }

        // =========================
        // 🔹 TRANSFERENCIA
        // =========================
        if (tipo === 'transferencia') {

            if (!cuentaOrigen || !cuentaDestino) {
                throw new Error('Debe proporcionar cuentaOrigen y cuentaDestino');
            }

            if (cuentaOrigen === cuentaDestino) {
                throw new Error('No puede transferir a la misma cuenta');
            }

            const cuentaO = await BankAccount.findById(cuentaOrigen);
            const cuentaD = await BankAccount.findById(cuentaDestino);

            if (!cuentaO || !cuentaD) {
                throw new Error('Una de las cuentas no existe');
            }

            if (cuentaO.saldo < monto) {
                throw new Error('Saldo insuficiente');
            }

            cuentaO.saldo -= monto;
            cuentaD.saldo += monto;

            await cuentaO.save();
            await cuentaD.save();

            const transaction = await Transaction.create({
                tipo,
                monto,
                cuentaOrigen,
                cuentaDestino
            });

            // Correo al que envía
            await tryEmail(cuentaO.usuarioId, 'Transferencia enviada', {
                tipo: 'transferencia',
                monto,
                saldo: cuentaO.saldo
            });

            // Correo al que recibe
            await tryEmail(cuentaD.usuarioId, 'Transferencia recibida', {
                tipo: 'transferencia',
                monto,
                saldo: cuentaD.saldo
            });

            return res.status(201).json({
                success: true,
                message: 'Transferencia realizada correctamente',
                data: transaction
            });
        }

        throw new Error('Tipo de transacción inválido. Use: deposito, retiro o transferencia');

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
            if (cuenta) { cuenta.saldo -= transaction.monto; await cuenta.save(); }
        }

        if (transaction.tipo === 'retiro') {
            const cuenta = await BankAccount.findById(transaction.cuentaOrigen);
            if (cuenta) { cuenta.saldo += transaction.monto; await cuenta.save(); }
        }

        if (transaction.tipo === 'transferencia') {
            const cuentaO = await BankAccount.findById(transaction.cuentaOrigen);
            const cuentaD = await BankAccount.findById(transaction.cuentaDestino);
            if (cuentaO) { cuentaO.saldo += transaction.monto; await cuentaO.save(); }
            if (cuentaD) { cuentaD.saldo -= transaction.monto; await cuentaD.save(); }
        }

        // =========================
        //  APLICAR NUEVA OPERACIÓN
        // =========================

        transaction.tipo  = tipo  || transaction.tipo;
        transaction.monto = monto || transaction.monto;

        if (transaction.monto <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }

        if (transaction.tipo === 'deposito') {
            const cuenta = await BankAccount.findById(transaction.cuentaDestino);
            if (cuenta) { cuenta.saldo += transaction.monto; await cuenta.save(); }
        }

        if (transaction.tipo === 'retiro') {
            const cuenta = await BankAccount.findById(transaction.cuentaOrigen);
            if (!cuenta || cuenta.saldo < transaction.monto) throw new Error('Saldo insuficiente');
            cuenta.saldo -= transaction.monto;
            await cuenta.save();
        }

        if (transaction.tipo === 'transferencia') {
            const cuentaO = await BankAccount.findById(transaction.cuentaOrigen);
            const cuentaD = await BankAccount.findById(transaction.cuentaDestino);
            if (!cuentaO || !cuentaD) throw new Error('Una de las cuentas no existe');
            if (cuentaO.saldo < transaction.monto) throw new Error('Saldo insuficiente');
            cuentaO.saldo -= transaction.monto;
            cuentaD.saldo += transaction.monto;
            await cuentaO.save();
            await cuentaD.save();
        }

        await transaction.save();

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
