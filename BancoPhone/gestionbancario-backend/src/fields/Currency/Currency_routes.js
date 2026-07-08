import { Router } from 'express';
import { createCurrency, getCurrencies, updateCurrency, deleteCurrency, getCurrencyByCode } from './Currency_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

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
 */

/**
 * @swagger
 * /gestionbanco/v1/Currency/create:
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
 * /gestionbanco/v1/Currency:
 *   get:
 *     summary: Listar todas las divisas
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Lista de divisas
 */

/**
 * @swagger
 * /gestionbanco/v1/Currency/update/{id}:
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
 *         description: ID de la divisa (MongoDB ObjectId)
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
 */

/**
 * @swagger
 * /gestionbanco/v1/Currency/delete/{id}:
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
 */

/**
 * @swagger
 * /gestionbanco/v1/Currency/code/{codigo}:
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

router.post('/create', validateJWT, requireRole('ADMIN_ROLE'), createCurrency);
router.get('/', getCurrencies);
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE'), updateCurrency);
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteCurrency);
router.get('/code/:codigo', getCurrencyByCode);

export default router;
