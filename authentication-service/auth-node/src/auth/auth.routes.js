import { Router } from 'express';
import * as refreshController from './refresh.controller.js';
import * as authController from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
  authRateLimit,
  requestLimit,
} from '../../middlewares/request-limit.js';
import { upload, handleUploadError } from '../../helpers/file-upload.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
} from '../../middlewares/validation.js';

const router = Router();
// Refresh token endpoints
router.post('/refresh', refreshController.refresh);
router.post('/logout', refreshController.logout);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Registra un nuevo usuario
 *     description: Crea una nueva cuenta de usuario con validaciones de seguridad
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: name
 *         in: formData
 *         required: true
 *         type: string
 *         description: Nombre del usuario
 *       - name: surname
 *         in: formData
 *         required: true
 *         type: string
 *         description: Apellido del usuario
 *       - name: username
 *         in: formData
 *         required: true
 *         type: string
 *         description: Nombre de usuario único
 *       - name: email
 *         in: formData
 *         required: true
 *         type: string
 *         description: Email del usuario
 *       - name: password
 *         in: formData
 *         required: true
 *         type: string
 *         description: Contraseña (mínimo 8 caracteres)
 *       - name: phone
 *         in: formData
 *         required: true
 *         type: string
 *         description: Teléfono (8 dígitos)
 *       - name: profilePicture
 *         in: formData
 *         type: file
 *         description: Imagen de perfil (opcional)
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Errores de validación
 *       409:
 *         description: Email o username ya existe
 */
router.post(
  '/register',
  authRateLimit,
  upload.single('profilePicture'),
  handleUploadError,
  validateRegister,
  authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Autentica un usuario
 *     description: Inicia sesión con email/username y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 description: Email o nombre de usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada
 */
router.post('/login', authRateLimit, validateLogin, authController.login);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verifica el email del usuario
 *     description: Confirma la dirección de email usando el token enviado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de verificación de email
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post(
  '/verify-email',
  requestLimit, // Match .NET ApiPolicy (20 tokens per minute)
  validateVerifyEmail,
  authController.verifyEmail
);

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Reenvía el email de verificación
 *     description: Envía nuevamente el email de verificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *     responses:
 *       200:
 *         description: Email reenviado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
  '/resend-verification',
  authRateLimit, // Match .NET AuthPolicy (5 req/min)
  validateResendVerification,
  authController.resendVerification
);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Inicia recuperación de contraseña
 *     description: Envía email con token para resetear contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *     responses:
 *       200:
 *         description: Instrucciones enviadas al email
 */
router.post(
  '/forgot-password',
  authRateLimit, // Match .NET AuthPolicy (5 req/min)
  validateForgotPassword,
  authController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Resetea la contraseña
 *     description: Cambia la contraseña usando el token de recuperación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de recuperación de contraseña
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post(
  '/reset-password',
  authRateLimit,
  validateResetPassword,
  authController.resetPassword
);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Obtiene el perfil del usuario
 *     description: Devuelve la información del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Email no verificado
 */
router.get('/profile', validateJWT, authController.getProfile);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     tags: [Profile]
 *     summary: Actualiza los datos del perfil del usuario autenticado
 *     description: Modifica nombre, apellido, username, email y teléfono
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       400:
 *         description: Datos inválidos
 */
router.put('/profile', validateJWT, authController.updateProfile);

/**
 * @swagger
 * /api/v1/auth/profile/avatar:
 *   post:
 *     tags: [Profile]
 *     summary: Sube o actualiza la foto de perfil del usuario autenticado
 *     description: Permite subir una imagen de perfil en formato multipart/form-data
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto de perfil actualizada correctamente
 *       400:
 *         description: Error en la imagen
 */
router.post(
  '/profile/avatar',
  validateJWT,
  upload.single('profilePicture'),
  handleUploadError,
  authController.updateProfileAvatar
);

/**
 * @swagger
 * /api/v1/auth/profile/avatar:
 *   delete:
 *     tags: [Profile]
 *     summary: Elimina la foto de perfil del usuario autenticado
 *     description: Reemplaza la foto actual por el avatar por defecto
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foto de perfil eliminada correctamente
 *       401:
 *         description: Token inválido
 */
router.delete('/profile/avatar', validateJWT, authController.deleteProfileAvatar);

/**
 * @swagger
 * /api/v1/auth/profile/by-id:
 *   post:
 *     tags: [Profile]
 *     summary: Obtiene el perfil del usuario por ID
 *     description: Devuelve la información del usuario basándose en el userId proporcionado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       400:
 *         description: userId no proporcionado
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/profile/by-id', requestLimit, authController.getProfileById);

export default router;
