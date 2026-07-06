import { Router } from 'express';
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionByTipo,
    getMyTransactions,
    getTransactionsByAccount
} from './transactions_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionInput:
 *       type: object
 *       required:
 *         - tipo
 *         - monto
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [deposito, retiro, transferencia]
 *           example: transferencia
 *         monto:
 *           type: number
 *           example: 500.00
 *         cuentaOrigen:
 *           type: string
 *           description: ID de la cuenta origen (MongoDB ObjectId)
 *           example: 664a1f2e3c4b5d6e7f8a9b0c
 *         cuentaDestino:
 *           type: string
 *           description: ID de la cuenta destino (MongoDB ObjectId)
 *           example: 664a1f2e3c4b5d6e7f8a9b0d
 */

/**
 * @swagger
 * /gestionbanco/v1/transactions/create:
 *   post:
 *     summary: Crear una transacción bancaria
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       201:
 *         description: Transacción creada exitosamente
 *       400:
 *         description: Datos inválidos o saldo insuficiente
 */

/**
 * @swagger
 * /gestionbanco/v1/transactions:
 *   get:
 *     summary: Listar todas las transacciones
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Lista de transacciones
 */

/**
 * @swagger
 * /gestionbanco/v1/transactions/update/{id}:
 *   put:
 *     summary: Actualizar una transacción (solo ADMIN)
 *     tags: [Transactions]
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
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       200:
 *         description: Transacción actualizada
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /gestionbanco/v1/transactions/delete/{id}:
 *   delete:
 *     summary: Eliminar una transacción (solo ADMIN)
 *     tags: [Transactions]
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
 *         description: Transacción eliminada
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /gestionbanco/v1/transactions/type/{tipo}:
 *   get:
 *     summary: Buscar transacciones por tipo
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [deposito, retiro, transferencia]
 *         description: Tipo de transacción
 *     responses:
 *       200:
 *         description: Lista de transacciones del tipo indicado
 */

/**
 * @swagger
 * /gestionbanco/v1/transactions/{id}:
 *   get:
 *     summary: Obtener transacción por ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transacción encontrada
 *       404:
 *         description: No encontrada
 */

router.post('/create', validateJWT, createTransaction);
router.get('/', validateJWT, getTransactions);
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE'), updateTransaction);
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteTransaction);
router.get('/my', validateJWT, getMyTransactions);
router.get('/type/:tipo', validateJWT, getTransactionByTipo);
router.get('/account/:accountId', validateJWT, getTransactionsByAccount);
router.get('/:id', validateJWT, getTransactionById);

export default router;
