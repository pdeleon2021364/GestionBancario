'use strict';

import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre del campo es requerido'],
            trim: true,
            maxLength: [100, 'El nombre no puede exceder 100 caracteres'],
        },
        numeroCuenta: {
            type: String,
            required: [true, 'El número de cuenta es requerido'],
            unique: true,
            trim: true
        },
        tipoCuenta: {
            type: String,
            required: [true, 'El tipo de cuenta es requerido'],
            enum: ['ahorro', 'corriente']
        },
        saldo: {
            type: Number,
            required: [true, 'El saldo es requerido'],
            default: 0,
            min: [0, 'El saldo no puede ser negativo']
        },
        usuarioId: {
            type: Number,
            required: true
        },
        estado: {
            type: String,
            required: true,
            enum: ['activa', 'inactiva'],
            default: 'activa'
        },
        fechaCreacion: {
            type: Date,
            default: Date.now,
            required: true
        },
        ingresos: {
            type: Number,
            required: [true, 'Los ingresos son requeridos'],
            min: [100, 'Los ingresos deben ser de al menos Q100.00']
        },

    },
    {
        timestamps: true
    }
);


const BankAccount = mongoose.models.BankAccount || mongoose.model('BankAccount', fieldSchema);
export default BankAccount;
