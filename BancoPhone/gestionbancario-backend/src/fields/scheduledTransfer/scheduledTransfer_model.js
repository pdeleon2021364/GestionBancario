'use strict';
import mongoose from 'mongoose';

const scheduledTransferSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true, maxLength: 100 },
    cuentaOrigen: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    cuentaDestinoNumero: { type: String, required: true, trim: true },
    monto: { type: Number, required: true, min: [0.01, 'El monto debe ser mayor a 0'] },
    frecuencia: { type: String, enum: ['unica', 'diaria', 'semanal', 'quincenal', 'mensual'], default: 'unica' },
    proximaEjecucion: { type: Date, default: null },
    ultimaEjecucion: { type: Date, default: null },
    usuarioId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    descripcion: { type: String, trim: true, maxLength: 255 },
    estado: { type: String, enum: ['activa', 'pausada', 'completada', 'cancelada'], default: 'activa' },
    ejecuciones: { type: Number, default: 0 }
}, { timestamps: true });

const ScheduledTransfer = mongoose.model('ScheduledTransfer', scheduledTransferSchema);
export default ScheduledTransfer;
