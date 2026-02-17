'use strict';

import mongoose from 'mongoose';

const currencySchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre de la divisa es requerido'],
            trim: true,
            maxLength: [50, 'El nombre no puede exceder 50 caracteres'],
        },
        codigo: {
            type: String,
            required: [true, 'El código es requerido'],
            uppercase: true,
            unique: true,
            trim: true,
            maxLength: [5, 'El código no puede exceder 5 caracteres'],
        },
        simbolo: {
            type: String,
            required: [true, 'El símbolo es requerido'],
        },
    },
    {
        timestamps: true,
    }
);

const Currency = mongoose.model('Currency', currencySchema);

export default Currency;
