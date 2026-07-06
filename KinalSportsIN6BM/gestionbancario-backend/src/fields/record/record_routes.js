import { Router } from 'express';
import {
    createRecord,
    getRecords,
    updateRecord,
    deleteRecord,
    getRecordById,
    getRecordsByAccount
} from './record_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RecordInput:
 *       type: object
 *       required:
 *         - cuentaId
 *       properties:
 *         cuentaId:
 *           type: string
 *           description: ID de la cuenta bancaria (MongoDB ObjectId)
 *           example: 664a1f2e3c4b5d6e7f8a9b0c
 *         listaTransacciones:
 *           type: string
 *           description: ID de la transacción asociada (MongoDB ObjectId)
 *           example: 664a1f2e3c4b5d6e7f8a9b0d
 */

/**
 * @swagger
 * /gestionbanco/v1/record/create:
 *   post:
 *     summary: Crear un historial de cuenta (solo ADMIN)
 *     tags: [Record]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordInput'
 *     responses:
 *       201:
 *         description: Historial creado
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /gestionbanco/v1/record:
 *   get:
 *     summary: Listar todos los historiales
 *     tags: [Record]
 *     responses:
 *       200:
 *         description: Lista de historiales
 */

/**
 * @swagger
 * /gestionbanco/v1/record/update/{id}:
 *   put:
 *     summary: Actualizar un historial (solo ADMIN)
 *     tags: [Record]
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
 *             $ref: '#/components/schemas/RecordInput'
 *     responses:
 *       200:
 *         description: Historial actualizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/record/delete/{id}:
 *   delete:
 *     summary: Eliminar un historial (solo ADMIN)
 *     tags: [Record]
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
 *         description: Historial eliminado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/record/account/{cuentaId}:
 *   get:
 *     summary: Obtener historiales por cuenta bancaria
 *     tags: [Record]
 *     parameters:
 *       - in: path
 *         name: cuentaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cuenta bancaria (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Historiales de la cuenta
 *       404:
 *         description: Cuenta no encontrada
 */

/**
 * @swagger
 * /gestionbanco/v1/record/{id}:
 *   get:
 *     summary: Obtener historial por ID
 *     tags: [Record]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial encontrado
 *       404:
 *         description: No encontrado
 */

router.post('/create', validateJWT, requireRole('ADMIN_ROLE'), createRecord);
router.get('/', getRecords);
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE'), updateRecord);
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteRecord);
router.get('/account/:cuentaId', getRecordsByAccount);
router.get('/:id', getRecordById);

export default router;
