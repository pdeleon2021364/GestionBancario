    import { Router } from 'express';
    import {
        createFavorite,
        getFavorites,
        updateFavorite,
        deleteFavorite,
        getFavoriteById,
        getFavoriteByAlias
    } from './favorites_controller.js';

    import { validateJWT } from '../../../middlewares/validate_jwt.js';

    const router = Router();

    /**
     * Crear favorito
     */
    router.post(
        '/create',
        validateJWT,
        createFavorite
    );

    /**
     * Listar favoritos del usuario logueado
     */
    router.get(
        '/',
        validateJWT,
        getFavorites
    );

    /**
     * Editar favorito
     */
    router.put(
        '/update/:id',
        validateJWT,
        updateFavorite
    );

    /**
     * Eliminar favorito
     */
    router.delete(
        '/delete/:id',
        validateJWT,
        deleteFavorite
    );

    /**
 * Buscar favorito por alias
 */
router.get(
    '/alias/:alias',
    validateJWT,
    getFavoriteByAlias
);

/**
 * Buscar favorito por id
 */
router.get(
    '/:id',
    validateJWT,
    getFavoriteById
);

    export default router;