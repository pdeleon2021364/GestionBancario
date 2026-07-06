'use strict';

import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema(
    {
        nameDestiny: {
            type: String,
            required: true,
            trim: true,
        },
        divisaBase: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Currency',
            required: true,
        },
        divisaDestino: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Currency',
            required: true,
        },
        tasa: {
            type: Number,
            required: true,
            min: [0, 'La tasa debe ser mayor que 0'],
        },
    },
    {
        timestamps: true,
    }
);

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

export default ExchangeRate;
