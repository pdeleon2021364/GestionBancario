import { Router } from 'express';
import { createCurrency, getCurrencies, updateCurrency, deleteCurrency, getCurrencyByCode, getCurrencyById } from './Currency_controller.js';
import { validateJWT } from '../middlewares/validate_jwt.js';
import { requireRole } from '../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CurrencyInput:
 *       type: object
 *       required:
 *         - nombre
 *         - codigo
 *         - simbolo
 *       properties:
 *         nombre:
 *           type: string
 *           example: Quetzal
 *         codigo:
 *           type: string
 *           example: GTQ
 *         simbolo:
 *           type: string
 *           example: Q
 *         estado:
 *           type: string
 *           enum: [activo, inactivo]
 *           example: activo
 */

/**
 * @swagger
 * /currency/v1/Currency:
 *   get:
 *     summary: Listar todas las divisas
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Lista de divisas
 *   post:
 *     summary: Crear una nueva divisa (solo ADMIN)
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CurrencyInput'
 *     responses:
 *       201:
 *         description: Divisa creada exitosamente
 *       400:
 *         description: Código de divisa ya existe
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /currency/v1/Currency/{id}:
 *   get:
 *     summary: Obtener una divisa por ID
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Divisa encontrada
 *       404:
 *         description: Divisa no encontrada
 *   put:
 *     summary: Actualizar una divisa (solo ADMIN)
 *     tags: [Currency]
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
 *             $ref: '#/components/schemas/CurrencyInput'
 *     responses:
 *       200:
 *         description: Divisa actualizada
 *       404:
 *         description: Divisa no encontrada
 *       403:
 *         description: Requiere rol ADMIN
 *   delete:
 *     summary: Eliminar una divisa (solo ADMIN)
 *     tags: [Currency]
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
 *         description: Divisa eliminada
 *       404:
 *         description: Divisa no encontrada
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /currency/v1/Currency/code/{codigo}:
 *   get:
 *     summary: Buscar divisa por código
 *     tags: [Currency]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la divisa (ej. GTQ, USD)
 *     responses:
 *       200:
 *         description: Divisa encontrada
 *       404:
 *         description: Divisa no encontrada
 */

router.get('/', getCurrencies);
router.post('/', validateJWT, requireRole('ADMIN_ROLE'), createCurrency);
router.get('/:id', getCurrencyById);
router.put('/:id', validateJWT, requireRole('ADMIN_ROLE'), updateCurrency);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteCurrency);
router.get('/code/:codigo', getCurrencyByCode);

export default router;