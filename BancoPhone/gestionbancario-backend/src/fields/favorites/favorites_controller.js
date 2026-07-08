import Favorite from './favorites_model.js';


import BankAccount from '../bankAccount/bankAccount_model.js';
import mongoose from 'mongoose';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeUserId = (userId) => {
    if (userId === undefined || userId === null) {
        throw new Error('Usuario no autenticado');
    }
    if (typeof userId === 'string' && /^\\d+$/.test(userId)) {
        return Number(userId);
    }
    return userId;
};

const buildUserFilter = (userId) => {
    const normalizedUserId = normalizeUserId(userId);
    return {
        $or: [
            { user: normalizedUserId },
            { user: String(normalizedUserId) }
        ]
    };
};

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

        const userFilter = buildUserFilter(req.user.id);

        // Evitar alias duplicado por usuario
        const aliasExists = await Favorite.findOne({
            ...userFilter,
            alias
        });

        if (aliasExists) {
            return res.status(400).json({
                success: false,
                message: 'Ya tienes un favorito con ese alias'
            });
        }

        const favorite = await Favorite.create({
            user: normalizeUserId(req.user.id),
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
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(10, Math.max(1, parseInt(limit, 10) || 10));
        const userFilter = buildUserFilter(req.user.id);

        const favorites = await Favorite.find(userFilter)
            .populate('bankAccount', 'numeroCuenta tipoCuenta saldo estado')
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        const total = await Favorite.countDocuments(userFilter);

        res.status(200).json({
            success: true,
            data: favorites,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
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

        const favorite = await Favorite.findById(id);

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        if (String(favorite.user) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso sobre este favorito'
            });
        }

        const updatedFavorite = await Favorite.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedFavorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Favorito actualizado',
            data: updatedFavorite
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
            ...buildUserFilter(req.user.id)
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
            ...buildUserFilter(req.user.id),
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

        const favorite = await Favorite.findById(id);

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado'
            });
        }

        if (String(favorite.user) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso sobre este favorito'
            });
        }

        const deletedFavorite = await Favorite.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Favorito eliminado',
            data: deletedFavorite
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
            ...buildUserFilter(req.user.id)
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
