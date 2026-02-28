import Favorite from './favorites_model.js';


export const createFavorite = async (req, res) => {
    try {

        const data = {
            ...req.body,
            user: req.user.id
        };

        const favorite = new Favorite(data);
        await favorite.save();

        res.status(201).json({
            success: true,
            message: 'Favorito creado correctamente',
            data: favorite
        });

    } catch (error) {
        res.status(400).json({
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
            .populate('user', 'name email')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
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
