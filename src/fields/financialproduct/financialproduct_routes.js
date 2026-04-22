import { Router } from 'express';
import {
    createFinancialProduct,
    getFinancialProducts,
    updateFinancialProduct,
    deleteFinancialProduct,
    getFinancialProductById,
    getFinancialProductByName
} from './financialproduct_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FinancialProductInput:
 *       type: object
 *       required:
 *         - nombre
 *         - descripcion
 *         - tasaInteres
 *         - tipoProducto
 *       properties:
 *         nombre:
 *           type: string
 *           example: Préstamo Personal
 *         descripcion:
 *           type: string
 *           example: Préstamo de libre inversión hasta 36 cuotas
 *         tasaInteres:
 *           type: number
 *           example: 12.5
 *         tipoProducto:
 *           type: string
 *           example: prestamo
 *         activo:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /gestionbanco/v1/financialproduct/create:
 *   post:
 *     summary: Crear un producto financiero (solo ADMIN)
 *     tags: [FinancialProduct]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialProductInput'
 *     responses:
 *       201:
 *         description: Producto financiero creado
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /gestionbanco/v1/financialproduct:
 *   get:
 *     summary: Listar todos los productos financieros
 *     tags: [FinancialProduct]
 *     responses:
 *       200:
 *         description: Lista de productos financieros
 */

/**
 * @swagger
 * /gestionbanco/v1/financialproduct/update/{id}:
 *   put:
 *     summary: Actualizar un producto financiero (solo ADMIN)
 *     tags: [FinancialProduct]
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
 *             $ref: '#/components/schemas/FinancialProductInput'
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/financialproduct/delete/{id}:
 *   delete:
 *     summary: Eliminar un producto financiero (solo ADMIN)
 *     tags: [FinancialProduct]
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
 *         description: Producto eliminado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/financialproduct/name/{nombre}:
 *   get:
 *     summary: Buscar producto financiero por nombre
 *     tags: [FinancialProduct]
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del producto financiero
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/financialproduct/{id}:
 *   get:
 *     summary: Obtener producto financiero por ID
 *     tags: [FinancialProduct]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: No encontrado
 */

router.post('/create', validateJWT, requireRole('ADMIN_ROLE'), createFinancialProduct);
router.get('/', getFinancialProducts);
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE'), updateFinancialProduct);
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteFinancialProduct);
router.get('/name/:nombre', getFinancialProductByName);
router.get('/:id', getFinancialProductById);

export default router;
