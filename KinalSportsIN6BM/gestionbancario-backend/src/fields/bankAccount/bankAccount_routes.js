import { Router } from 'express';
import {
    createField,
    createFieldsForUser,
    getFields,
    updateField,
    deleteField,
    getAccountByAccountNumber,
    sendAllBankAccountsPDF,
    sendBankAccountPDFById,
    toggleAccountStatus,
    getAccountById,
    retirarDinero,
    aplicarInteresMensual,
    getActiveDestinations
} from './bankAccount_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BankAccountInput:
 *       type: object
 *       required:
 *         - nombre
 *         - tipoCuenta
 *         - saldo
 *         - usuarioId
 *       properties:
 *         nombre:
 *           type: string
 *           example: Cuenta Principal
 *         tipoCuenta:
 *           type: string
 *           enum: [ahorro, corriente]
 *           example: ahorro
 *         saldo:
 *           type: number
 *           example: 5000.00
 *         usuarioId:
 *           type: integer
 *           example: 1
 *         estado:
 *           type: string
 *           enum: [activa, inactiva]
 *           example: activa
 */

/**
 * @swagger
 * /gestionbanco/v1/bankAccount/create:
 *   post:
 *     summary: Crear una cuenta bancaria
 *     tags: [BankAccount]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankAccountInput'
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /gestionbanco/v1/bankAccount:
 *   get:
 *     summary: Listar todas las cuentas bancarias
 *     tags: [BankAccount]
 *     responses:
 *       200:
 *         description: Lista de cuentas bancarias
 */

/**
 * @swagger
 * /gestionbanco/v1/bankAccount/update/{id}:
 *   put:
 *     summary: Actualizar una cuenta bancaria
 *     tags: [BankAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cuenta (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankAccountInput'
 *     responses:
 *       200:
 *         description: Cuenta actualizada
 *       404:
 *         description: Cuenta no encontrada
 */

/**
 * @swagger
 * /gestionbanco/v1/bankAccount/delete/{id}:
 *   delete:
 *     summary: Eliminar una cuenta bancaria (solo ADMIN)
 *     tags: [BankAccount]
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
 *         description: Cuenta eliminada
 *       404:
 *         description: Cuenta no encontrada
 */

/**
 * @swagger
 * /gestionbanco/v1/bankAccount/search/{accountNumber}:
 *   get:
 *     summary: Buscar cuenta por número de cuenta
 *     tags: [BankAccount]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de cuenta bancaria
 *     responses:
 *       200:
 *         description: Cuenta encontrada
 *       404:
 *         description: Cuenta no encontrada
 */

/**
 * @swagger
 * /gestionbanco/v1/bankAccount/send-pdf/all/{email}:
 *   get:
 *     summary: Enviar PDF con todas las cuentas al correo indicado (solo ADMIN)
 *     tags: [BankAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo destinatario
 *     responses:
 *       200:
 *         description: PDF enviado exitosamente
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /gestionbanco/v1/bankAccount/send-pdf/{id}/{email}:
 *   get:
 *     summary: Enviar PDF de una cuenta específica al correo indicado (solo ADMIN)
 *     tags: [BankAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cuenta bancaria
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo destinatario
 *     responses:
 *       200:
 *         description: PDF enviado exitosamente
 *       404:
 *         description: Cuenta no encontrada
 */

router.post('/create', validateJWT, requireRole('ADMIN_ROLE', 'CAJERO_ROLE'), createField);
router.post('/create/batch', validateJWT, requireRole('ADMIN_ROLE', 'CAJERO_ROLE'), createFieldsForUser);
router.get('/', validateJWT, getFields);
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE', 'CAJERO_ROLE'), updateField);
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteField);
router.get('/search/:accountNumber', validateJWT, getAccountByAccountNumber);
router.get('/search/numero/:numeroCuenta', validateJWT, getAccountByAccountNumber);
router.patch('/status/:id', validateJWT, requireRole('ADMIN_ROLE'), toggleAccountStatus);
router.get('/send-pdf/all/:email', validateJWT, requireRole('ADMIN_ROLE', 'AUDITOR_ROLE'), sendAllBankAccountsPDF);
router.get('/send-pdf/:id/:email', validateJWT, requireRole('ADMIN_ROLE', 'AUDITOR_ROLE'), sendBankAccountPDFById);

router.get('/destinations/active', validateJWT, getActiveDestinations);
router.get('/:id', validateJWT, getAccountById);
router.post('/withdraw/:id', validateJWT, retirarDinero);
router.post('/apply-interest/:id', validateJWT, requireRole('ADMIN_ROLE'), aplicarInteresMensual);

export default router;
