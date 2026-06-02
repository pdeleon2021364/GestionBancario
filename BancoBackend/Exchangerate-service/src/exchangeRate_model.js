'use strict';

import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema(
    {
        monedaOrigen: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Currency'
        },
        monedaDestino: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Currency'
        },
        tasa: {
            type: Number,
            required: true,
            min: [0.00000001, 'La tasa debe ser mayor a 0']
        },
        fecha: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    { timestamps: true }
);

exchangeRateSchema.index({ monedaOrigen: 1, monedaDestino: 1, fecha: -1 });

const ExchangeRate = mongoose.models.ExchangeRate || mongoose.model('ExchangeRate', exchangeRateSchema);
export default ExchangeRate;
