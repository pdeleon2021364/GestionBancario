import { Router } from 'express';
import { sendTransactionEmail, sendPdfEmail } from './notification_controller.js';

const router = Router();

/**
 * @swagger
 * /notification/v1/notify/email:
 *   post:
 *     summary: Enviar correo de notificacion de transaccion
 *     tags: [Notification]
 */
router.post('/email', sendTransactionEmail);

/**
 * @swagger
 * /notification/v1/notify/pdf:
 *   post:
 *     summary: Enviar correo con PDF adjunto
 *     tags: [Notification]
 */
router.post('/pdf', sendPdfEmail);

export default router;
