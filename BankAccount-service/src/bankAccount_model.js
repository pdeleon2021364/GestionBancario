'use strict';

import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es requerido'],
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
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Usuario'
        },
        usuarioEmail: {
            type: String,
            required: [true, 'El correo del usuario es requerido'],
            lowercase: true,
            trim: true,
            match: [/.+@.+\..+/, 'El correo electrónico no es válido'],
            maxLength: [100, 'El correo no puede exceder 100 caracteres']
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
        }
    },
    {
        timestamps: true
    }
);

const BankAccount = mongoose.models.BankAccount || mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;