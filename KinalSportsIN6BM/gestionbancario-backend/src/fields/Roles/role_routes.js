import { Router } from 'express';
import { createField, getFields, updateField, deleteField } from './role_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RolInput:
 *       type: object
 *       required:
 *         - nombre
 *         - permissions
 *       properties:
 *         nombre:
 *           type: string
 *           example: ADMIN_ROLE
 *         permissions:
 *           type: string
 *           example: read,write,delete
 */

/**
 * @swagger
 * /gestionbanco/v1/Roles/create:
 *   post:
 *     summary: Crear un nuevo rol (solo ADMIN)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolInput'
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /gestionbanco/v1/Roles:
 *   get:
 *     summary: Listar todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles
 */

/**
 * @swagger
 * /gestionbanco/v1/Roles/update/{id}:
 *   put:
 *     summary: Actualizar un rol (solo ADMIN)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rol (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolInput'
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       404:
 *         description: Rol no encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/Roles/delete/{id}:
 *   delete:
 *     summary: Eliminar un rol (solo ADMIN)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rol (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Rol eliminado
 *       404:
 *         description: Rol no encontrado
 */

router.post('/create', validateJWT, requireRole('ADMIN_ROLE'), createField);
router.get('/', getFields);
router.put('/update/:id', validateJWT, requireRole('ADMIN_ROLE'), updateField);
router.delete('/delete/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteField);

export default router;
