'use strict';

import mongoose from 'mongoose';

const financialProductSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        descripcion: {
            type: String,
            required: true,
            trim: true,
        },
        tasaInteres: {
            type: Number,
            required: true,
        },
        tipoProducto: {
            type: String,
            required: true,
        },
        activo: {
            type: Boolean,
            default: true,
        },
        requiereAprobacion: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const FinancialProduct = mongoose.model('FinancialProduct', financialProductSchema);

export default FinancialProduct;
