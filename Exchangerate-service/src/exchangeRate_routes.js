import { Router } from 'express';
import {
    createExchangeRate,
    getExchangeRates,
    updateExchangeRate,
    deleteExchangeRate,
    getExchangeRateById
} from './exchangeRate_controller.js';
import { convertCurrency } from './conversion_controller.js';
import { validateJWT } from '../middlewares/validate_jwt.js';
import { requireRole } from '../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ExchangeRateInput:
 *       type: object
 *       required:
 *         - monedaOrigen
 *         - monedaDestino
 *         - tasa
 *       properties:
 *         monedaOrigen:
 *           type: string
 *           description: ID de la divisa origen (Currency)
 *         monedaDestino:
 *           type: string
 *           description: ID de la divisa destino (Currency)
 *         tasa:
 *           type: number
 *           example: 7.75
 *         fecha:
 *           type: string
 *           format: date-time
 *     ConvertInput:
 *       type: object
 *       required:
 *         - from
 *         - to
 *         - amount
 *       properties:
 *         from:
 *           type: string
 *         to:
 *           type: string
 *         amount:
 *           type: number
 *           example: 100
 */

/**
 * @swagger
 * /exchangerate/v1/ExchangeRate/create:
 *   post:
 *     summary: Crear un tipo de cambio (solo ADMIN)
 *     tags: [ExchangeRate]
 *     security:
 *       - bearerAuth: []
 */
router.post('/create', validateJWT, requireRole('ADMIN_ROLE'), createExchangeRate);

/**
 * @swagger
 * /exchangerate/v1/ExchangeRate:
 *   get:
 *     summary: Listar tipos de cambio con paginacion (solo ADMIN)
 *     tags: [ExchangeRate]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', validateJWT, requireRole('ADMIN_ROLE'), getExchangeRates);

/**
 * @swagger
 * /exchangerate/v1/ExchangeRate/update/{id}:
 *   put:
 *     summary: Actualizar un tipo de cambio (solo ADMIN)
 *     tags: [ExchangeRate]
 *     security:
 *       - bearerAuth: []
 */
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE'), updateExchangeRate);

/**
 * @swagger
 * /exchangerate/v1/ExchangeRate/delete/{id}:
 *   delete:
 *     summary: Eliminar un tipo de cambio (solo ADMIN)
 *     tags: [ExchangeRate]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteExchangeRate);

/**
 * @swagger
 * /exchangerate/v1/ExchangeRate/{id}:
 *   get:
 *     summary: Obtener tipo de cambio por ID (solo ADMIN)
 *     tags: [ExchangeRate]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', validateJWT, requireRole('ADMIN_ROLE'), getExchangeRateById);

/**
 * @swagger
 * /exchangerate/v1/ExchangeRate/convert:
 *   post:
 *     summary: Convertir un monto entre divisas (publico)
 *     tags: [ExchangeRate]
 */
router.post('/convert', convertCurrency);

export default router;
