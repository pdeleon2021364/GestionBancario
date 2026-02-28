'use strict';

import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
{
    user: {
        type: String,
        required: true
    },

    alias: {
        type: String,
        required: true,
        trim: true
    },

    accountNumber: {
        type: String,
        required: true,
        trim: true
    },

    bankName: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    }
},
{
    timestamps: true
}
);

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;