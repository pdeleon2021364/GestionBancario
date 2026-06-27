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
            trim: true,
            minlength: [6, 'El numero de cuenta debe tener al menos 6 caracteres'],
            maxlength: [30, 'El numero de cuenta no puede exceder 30 caracteres'],
            match: [/^[A-Z0-9-]+$/i, 'El numero de cuenta solo puede contener letras, numeros y guiones']
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
            type: mongoose.Schema.Types.Mixed,
            required: true,
            index: true
        },
        usuarioEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        estado: {
            type: String,
            required: true,
            enum: ['activa', 'inactiva', 'bloqueada', 'cerrada'],
            default: 'activa'
        },
        closedAt: {
            type: Date,
            default: null
        },
        closedBy: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        closedReason: {
            type: String,
            trim: true,
            maxLength: [255, 'El motivo de cierre no puede exceder 255 caracteres'],
            default: null
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

bankAccountSchema.index({ usuarioId: 1, estado: 1 });

const BankAccount = mongoose.models.BankAccount || mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;
