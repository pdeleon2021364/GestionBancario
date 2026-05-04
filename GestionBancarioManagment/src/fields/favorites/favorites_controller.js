import Favorite from './favorites_model.js';


import BankAccount from '../bankAccount/bankAccount_model.js';
import mongoose from 'mongoose';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createFavorite = async (req, res) => {
    try {

        const { alias, bankAccount } = req.body;

        if (!alias || !bankAccount) {
            return res.status(400).json({
                success: false,
                message: 'alias y bankAccount son obligatorios'
            });
        }

        if (!isValidId(bankAccount)) {
            return res.status(400).json({
                success: false,
                message: 'ID de cuenta inválido'
            });
        }

        const account = await BankAccount.findById(bankAccount);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        // Evitar alias duplicado por usuario
        const aliasExists = await Favorite.findOne({
            user: req.user.id,
            alias
        });

        if (aliasExists) {
            return res.status(400).json({
                success: false,
                message: 'Ya tienes un favorito con ese alias'
            });
        }

        const favorite = await Favorite.create({
            user: req.user.id,
            alias,
            bankAccount
        });

        return res.status(201).json({
            success: true,
            message: 'Favorito creado correctamente',
            data: favorite
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al crear favorito',
            error: error.message
        });
    }
};
/**
 * Obtener favoritos del usuario
 */
export const getFavorites = async (req, res) => {
    try {

        const { page = 1, limit = 10 } = req.query;

        const favorites = await Favorite.find({ user: req.user.id })
            .populate('bankAccount', 'numeroCuenta tipoCuenta saldo estado')
            .sort({ createdAt: -1 });

        const total = await Favorite.countDocuments({ user: req.user.id });

        res.status(200).json({
            success: true,
            data: favorites,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener favoritos',
            error: error.message
        });
    }
};

/**
 * Actualizar favorito
 */
export const updateFavorite = async (req, res) => {
    try {

        const { id } = req.params;

        const favorite = await Favorite.findOneAndUpdate(
            { _id: id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Favorito actualizado',
            data: favorite
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar favorito',
            error: error.message
        });
    }
};

export const getFavoriteById = async (req, res) => {
    try {

        const { id } = req.params;

        const favorite = await Favorite.findOne({
            _id: id,
            user: req.user.id
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: favorite
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar favorito',
            error: error.message
        });
    }
};

export const getFavoriteByAlias = async (req, res) => {
    try {

        const { alias } = req.params;

        if (!alias) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar el alias'
            });
        }

        const favorite = await Favorite.findOne({
            user: req.user.id,
            alias: { $regex: alias, $options: 'i' }
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: favorite
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar favorito',
            error: error.message
        });
    }
};

/**
 * Eliminar favorito
 */
export const deleteFavorite = async (req, res) => {
    try {

        const { id } = req.params;

        const favorite = await Favorite.findOneAndDelete({
            _id: id,
            user: req.user.id
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Favorito eliminado',
            data: favorite
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar favorito',
            error: error.message
        });
    }
};

export const transferFromFavorite = async (req, res) => {
    try {

        const { favoriteId, amount, fromAccountId } = req.body;

        if (!favoriteId || !amount || !fromAccountId) {
            return res.status(400).json({
                success: false,
                message: 'favoriteId, amount y fromAccountId son obligatorios'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        const favorite = await Favorite.findOne({
            _id: favoriteId,
            user: req.user.id
        }).populate('bankAccount');

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        const fromAccount = await BankAccount.findById(fromAccountId);

        if (!fromAccount) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta origen no encontrada'
            });
        }

        if (fromAccount.saldo < amount) {
            return res.status(400).json({
                success: false,
                message: 'Fondos insuficientes'
            });
        }

        // Transferencia
        fromAccount.saldo -= amount;
        favorite.bankAccount.saldo += amount;

        await fromAccount.save();
        await favorite.bankAccount.save();

        return res.status(200).json({
            success: true,
            message: 'Transferencia realizada correctamente',
            data: {
                fromAccount,
                toAccount: favorite.bankAccount
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en transferencia rápida',
            error: error.message
        });
    }
};