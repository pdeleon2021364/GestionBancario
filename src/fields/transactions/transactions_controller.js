import mongoose from 'mongoose';

import Transaction from './transactions_model.js';
import BankAccount from '../bankAccount/bankAccount_model.js';
import User from '../Usuarios/usuarios.model.js';
import { sendEmail } from '../../../utils/sendEmail.js';
import { emailTemplate } from '../../../utils/emailTemplate.js';

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

            const cuenta = await BankAccount.findById(cuentaDestino);
            if (!cuenta) throw new Error('Cuenta destino no encontrada');

            cuenta.saldo += monto;
            await cuenta.save();

            const transaction = await Transaction.create({
                tipo,
                monto,
                cuentaDestino
            });

            // 🔹 Buscar usuario en SQL
            const usuario = await User.findByPk(cuenta.usuarioId);

            await sendEmail(
                usuario.email,
                'Depósito realizado',
                emailTemplate({
                    tipo: 'deposito',
                    monto: monto,
                    saldo: cuenta.saldo
                })
            );

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

            const usuario = await User.findByPk(cuenta.usuarioId);

            await sendEmail(
                usuario.email,
                'Retiro realizado',
                emailTemplate({
                    tipo: 'retiro',
                    monto: monto,
                    saldo: cuenta.saldo
                })
            );

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

            // 🔹 Buscar usuarios en SQL
            const usuarioOrigen = await User.findByPk(cuentaO.usuarioId);
            const usuarioDestino = await User.findByPk(cuentaD.usuarioId);

            // Correo al que envía
            await sendEmail(
                usuarioOrigen.email,
                'Transferencia enviada',
                emailTemplate({
                    tipo: 'transferencia',
                    monto: monto,
                    saldo: cuentaO.saldo
                })
            );

            // Correo al que recibe
            await sendEmail(
                usuarioDestino.email,
                'Transferencia Recibida',
                emailTemplate({
                    tipo: 'transferencia',
                    monto: monto,
                    saldo: cuentaD.saldo
                })
            );

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
        const data = req.body;

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        ).populate('cuentaOrigen cuentaDestino');

        if (!updatedTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transacción actualizada correctamente',
            data: updatedTransaction
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la transacción',
            error: error.message
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
