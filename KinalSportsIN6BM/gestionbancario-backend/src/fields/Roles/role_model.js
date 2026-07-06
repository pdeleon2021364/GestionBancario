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
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        permissions: { 
            type: String, 
            required: true 
        }
    },
    {
        timestamps: true,
    }
);

fieldSchema.index({ isActive: 1 });
fieldSchema.index({ fieldType: 1 });
fieldSchema.index({ isActive: 1, fieldType: 1 });

const Role = mongoose.models.Role 
    || mongoose.model('Role', fieldSchema);


export default Role;
