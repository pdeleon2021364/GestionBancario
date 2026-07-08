import mongoose from 'mongoose';

const userProductSchema = new mongoose.Schema(
    {
        usuarioId: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            index: true,
        },
        productoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FinancialProduct',
            required: true,
        },
        estado: {
            type: String,
            enum: ['pendiente', 'activo', 'rechazado', 'cancelado'],
            default: 'pendiente',
        },
        requiereAprobacion: {
            type: Boolean,
            default: false,
        },
        fechaSolicitud: {
            type: Date,
            default: Date.now,
        },
        fechaAprobacion: {
            type: Date,
            default: null,
        },
        aprobadoPor: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        motivoRechazo: {
            type: String,
            trim: true,
            default: null,
        },
        cuentaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BankAccount',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

userProductSchema.index({ usuarioId: 1, productoId: 1 });
userProductSchema.index({ estado: 1 });

const UserProduct = mongoose.model('UserProduct', userProductSchema);

export default UserProduct;
