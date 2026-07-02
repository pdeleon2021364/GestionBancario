import { Router } from 'express';
import {
  login,
  refreshToken,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  listUsers,
  resendVerification
} from './auth_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         nombre:
 *           type: string
 *           example: Juan Pérez
 *         email:
 *           type: string
 *           format: email
 *           example: juan@banco.com
 *         password:
 *           type: string
 *           example: MiPassword123
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: juan@banco.com
 *         password:
 *           type: string
 *           example: MiPassword123
 *     VerifyEmailInput:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *     RequestResetInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     ResetPasswordInput:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *         newPassword:
 *           type: string
 *     ResendVerificationInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 */

/**
 * @swagger
 * /gestionbanco/v1/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos o email ya registrado
 */

/**
 * @swagger
 * /gestionbanco/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token JWT
 *       401:
 *         description: Credenciales incorrectas o email no verificado
 */

/**
 * @swagger
 * /gestionbanco/v1/auth/verify-email:
 *   post:
 *     summary: Verificar correo electrónico con token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailInput'
 *     responses:
 *       200:
 *         description: Email verificado correctamente
 *       400:
 *         description: Token inválido o expirado
 */

/**
 * @swagger
 * /gestionbanco/v1/auth/resend-verification:
 *   post:
 *     summary: Reenviar correo de verificación
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationInput'
 *     responses:
 *       200:
 *         description: Correo reenviado exitosamente
 *       400:
 *         description: Usuario no encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/auth/request-reset:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestResetInput'
 *     responses:
 *       200:
 *         description: Correo de restablecimiento enviado
 */

/**
 * @swagger
 * /gestionbanco/v1/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200:
 *         description: Contraseña restablecida correctamente
 *       400:
 *         description: Token inválido o expirado
 */

/**
 * @swagger
 * /gestionbanco/v1/auth/users:
 *   get:
 *     summary: Listar todos los usuarios registrados
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/users', listUsers);
router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token no proporcionado' });
    }
    return res.send(`<h1>Token recibido:</h1><p>${token}</p>`);
});
router.post('/resend-verification', resendVerification);

export default router;
