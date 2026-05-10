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
            min: 0,
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
            default: 'completado',
        },
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
