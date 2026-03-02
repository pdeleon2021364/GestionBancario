'use strict';

import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
{
    user: {
        type: Number,
        required: true
    },

    alias: {
        type: String,
        required: [true, 'El alias es obligatorio'],
        trim: true,
        maxLength: [50, 'El alias no puede superar 50 caracteres']
    },

    bankAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: [true, 'La cuenta bancaria es obligatoria']
    }
},
{
    timestamps: true
}
);

const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);

export default Favorite;