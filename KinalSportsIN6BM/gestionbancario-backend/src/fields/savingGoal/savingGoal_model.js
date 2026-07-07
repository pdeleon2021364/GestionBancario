'use strict';
import mongoose from 'mongoose';

const savingGoalSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true, maxLength: 100 },
    metaAmount: { type: Number, required: true, min: [1, 'La meta debe ser mayor a 0'] },
    currentAmount: { type: Number, default: 0, min: 0 },
    usuarioId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    deadline: { type: Date, default: null },
    color: { type: String, default: '#0ea5e9', trim: true },
    estado: { type: String, enum: ['activa', 'completada', 'cancelada'], default: 'activa' },
    completadaAt: { type: Date, default: null }
}, { timestamps: true });

const SavingGoal = mongoose.model('SavingGoal', savingGoalSchema);
export default SavingGoal;
