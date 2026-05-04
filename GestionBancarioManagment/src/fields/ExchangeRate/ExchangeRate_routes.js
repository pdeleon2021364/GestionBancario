import { Router } from 'express';
import { createExchangeRate, getExchangeRates, updateExchangeRate, deleteExchangeRate, getExchangeRateById } from './ExchangeRate_controller.js';
import { convertCurrency } from './conversion_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ExchangeRateInput:
 *       type: object
 *       required:
 *         - nameDestiny
 *         - divisaBase
 *         - divisaDestino
 *         - tasa
 *       properties:
 *         nameDestiny:
 *           type: string
 *           example: Quetzal a Dólar
 *         divisaBase:
 *           type: string
 *           description: ID de la divisa base (MongoDB ObjectId)
 *           example: 664a1f2e3c4b5d6e7f8a9b0c
 *         divisaDestino:
 *           type: string
 *           description: ID de la divisa destino (MongoDB ObjectId)
 *           example: 664a1f2e3c4b5d6e7f8a9b0d
 *         tasa:
 *           type: number
 *           example: 0.13
 *     ConvertInput:
 *       type: object
 *       required:
 *         - divisaBaseId
 *         - divisaDestinoId
 *         - monto
 *       properties:
 *         divisaBaseId:
 *           type: string
 *           description: ID de la divisa origen
 *           example: 664a1f2e3c4b5d6e7f8a9b0c
 *         divisaDestinoId:
 *           type: string
 *           description: ID de la divisa destino
 *           example: 664a1f2e3c4b5d6e7f8a9b0d
 *         monto:
 *           type: number
 *           example: 1000
 */

/**
 * @swagger
 * /gestionbanco/v1/ExchangeRate/create:
 *   post:
 *     summary: Crear un tipo de cambio (solo ADMIN)
 *     tags: [ExchangeRate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExchangeRateInput'
 *     responses:
 *       201:
 *         description: Tipo de cambio creado
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /gestionbanco/v1/ExchangeRate:
 *   get:
 *     summary: Listar todos los tipos de cambio
 *     tags: [ExchangeRate]
 *     responses:
 *       200:
 *         description: Lista de tipos de cambio
 */

/**
 * @swagger
 * /gestionbanco/v1/ExchangeRate/update/{id}:
 *   put:
 *     summary: Actualizar un tipo de cambio (solo ADMIN)
 *     tags: [ExchangeRate]
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
 *             $ref: '#/components/schemas/ExchangeRateInput'
 *     responses:
 *       200:
 *         description: Tipo de cambio actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/ExchangeRate/convert:
 *   post:
 *     summary: Convertir un monto entre divisas (solo ADMIN)
 *     tags: [ExchangeRate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConvertInput'
 *     responses:
 *       200:
 *         description: Conversión realizada exitosamente
 *       404:
 *         description: Tipo de cambio no encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/ExchangeRate/delete/{id}:
 *   delete:
 *     summary: Eliminar un tipo de cambio (solo ADMIN)
 *     tags: [ExchangeRate]
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
 *         description: Tipo de cambio eliminado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/ExchangeRate/{id}:
 *   get:
 *     summary: Obtener tipo de cambio por ID
 *     tags: [ExchangeRate]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tipo de cambio encontrado
 *       404:
 *         description: No encontrado
 */

router.post('/create', validateJWT, requireRole('ADMIN_ROLE'), createExchangeRate);
router.get('/', getExchangeRates);
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE'), updateExchangeRate);
router.post('/convert', validateJWT, requireRole('ADMIN_ROLE'), convertCurrency);
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteExchangeRate);
router.get('/:id', getExchangeRateById);

export default router;
