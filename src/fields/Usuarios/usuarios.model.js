'use strict';

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            maxLength: [100, 'El nombre no puede exceder 100 caracteres'],
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
        },
        rol: {
            type: String,
            enum: ['ADMIN_ROLE', 'USER_ROLE'],
            default: 'USER_ROLE',
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

export default User;
