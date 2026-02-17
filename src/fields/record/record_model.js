'use strict';

import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema(
    {
        cuentaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BankAccount',
            required: true,
        },
        listaTransacciones: 
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Transaction',
            },
        fechaActualizacion: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Record = mongoose.model('Record', recordSchema);

export default Record;
