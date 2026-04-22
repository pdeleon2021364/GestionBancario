import { Router } from 'express';
import {
    createFavorite,
    getFavorites,
    updateFavorite,
    deleteFavorite,
    getFavoriteById,
    getFavoriteByAlias,
    transferFromFavorite
} from './favorites_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FavoriteInput:
 *       type: object
 *       required:
 *         - alias
 *         - bankAccount
 *       properties:
 *         alias:
 *           type: string
 *           example: Cuenta de mamá
 *         bankAccount:
 *           type: string
 *           description: ID de la cuenta bancaria favorita (MongoDB ObjectId)
 *           example: 664a1f2e3c4b5d6e7f8a9b0c
 *     TransferFromFavoriteInput:
 *       type: object
 *       required:
 *         - favoriteId
 *         - monto
 *         - cuentaOrigenId
 *       properties:
 *         favoriteId:
 *           type: string
 *           description: ID del favorito destino
 *           example: 664a1f2e3c4b5d6e7f8a9b0e
 *         monto:
 *           type: number
 *           example: 200.00
 *         cuentaOrigenId:
 *           type: string
 *           description: ID de la cuenta bancaria origen
 *           example: 664a1f2e3c4b5d6e7f8a9b0c
 */

/**
 * @swagger
 * /gestionbanco/v1/favorites/create:
 *   post:
 *     summary: Agregar una cuenta a favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoriteInput'
 *     responses:
 *       201:
 *         description: Favorito creado exitosamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /gestionbanco/v1/favorites:
 *   get:
 *     summary: Listar favoritos del usuario autenticado
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de favoritos del usuario
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /gestionbanco/v1/favorites/update/{id}:
 *   put:
 *     summary: Actualizar un favorito
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoriteInput'
 *     responses:
 *       200:
 *         description: Favorito actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/favorites/delete/{id}:
 *   delete:
 *     summary: Eliminar un favorito
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorito eliminado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/favorites/alias/{alias}:
 *   get:
 *     summary: Buscar favorito por alias
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: Alias del favorito
 *     responses:
 *       200:
 *         description: Favorito encontrado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/favorites/transfer:
 *   post:
 *     summary: Transferir dinero a una cuenta favorita
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferFromFavoriteInput'
 *     responses:
 *       200:
 *         description: Transferencia realizada exitosamente
 *       400:
 *         description: Saldo insuficiente o datos inválidos
 *       404:
 *         description: Favorito o cuenta no encontrada
 */

/**
 * @swagger
 * /gestionbanco/v1/favorites/{id}:
 *   get:
 *     summary: Obtener favorito por ID
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorito encontrado
 *       404:
 *         description: No encontrado
 */

router.post('/create', validateJWT, createFavorite);
router.get('/', validateJWT, getFavorites);
router.put('/update/:id', validateJWT, updateFavorite);
router.delete('/delete/:id', validateJWT, deleteFavorite);
router.get('/alias/:alias', validateJWT, getFavoriteByAlias);
router.post('/transfer', validateJWT, transferFromFavorite);
router.get('/:id', validateJWT, getFavoriteById);

export default router;
