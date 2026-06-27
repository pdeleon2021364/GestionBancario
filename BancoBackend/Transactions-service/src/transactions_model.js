'use strict';

import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: ['deposito', 'retiro', 'transferencia'],
            required: true,
        },
        monto: {
            type: Number,
            required: true,
            min: [0.01, 'El monto debe ser mayor que 0'],
        },
        cuentaOrigen: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        cuentaDestino: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        estado: {
            type: String,
            enum: ['pendiente', 'completado', 'fallido', 'cancelado', 'reversado'],
            default: 'completado',
        },
        usuarioId: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            index: true,
        },
        referencia: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        idempotencyKey: {
            type: String,
            trim: true,
            index: true,
            sparse: true,
        },
        descripcion: {
            type: String,
            trim: true,
            maxLength: 255,
        },
        ip: {
            type: String,
            trim: true,
        },
        userAgent: {
            type: String,
            trim: true,
            maxLength: 255,
        },
        canal: {
            type: String,
            enum: ['web', 'api', 'movil', 'caja'],
            default: 'api',
        },
    },
    {
        timestamps: true,
    }
);

transactionSchema.index({ cuentaOrigen: 1, createdAt: -1 });
transactionSchema.index({ cuentaDestino: 1, createdAt: -1 });
transactionSchema.index({ usuarioId: 1, createdAt: -1 });
transactionSchema.index({ idempotencyKey: 1, usuarioId: 1 }, { unique: true, sparse: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
