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

export const revertirDeposito = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
        }

        if (transaction.tipo !== 'deposito') {
            return res.status(400).json({ success: false, message: 'Solo se pueden revertir depósitos' });
        }

        if (transaction.estado === 'revertido') {
            return res.status(400).json({ success: false, message: 'Este depósito ya fue revertido' });
        }

        const diffSegundos = Math.floor((new Date() - new Date(transaction.createdAt)) / 1000);
        if (diffSegundos > 60) {
            return res.status(400).json({
                success: false,
                message: `No se puede revertir: ya pasaron ${diffSegundos} segundos. El límite es 60.`
            });
        }

        const cuenta = await BankAccount.findById(transaction.cuentaDestino);
        if (!cuenta) {
            return res.status(404).json({ success: false, message: 'Cuenta destino no encontrada' });
        }

        cuenta.saldo -= transaction.monto;
        await cuenta.save();

        transaction.estado = 'revertido';
        await transaction.save();

        return res.status(200).json({
            success: true,
            message: `Depósito de Q${transaction.monto} revertido (${diffSegundos}s después)`,
            data: { transaccion: transaction, saldoActual: cuenta.saldo }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


