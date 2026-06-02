import { Router } from 'express';
import { createField, getFields, updateUser, deleteUser, confirmDeleteAdmin } from './usuarios.controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioInput:
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
 *         rol:
 *           type: string
 *           enum: [ADMIN_ROLE, USER_ROLE]
 *           example: USER_ROLE
 */

/**
 * @swagger
 * /gestionbanco/v1/Usuarios/create:
 *   post:
 *     summary: Crear un nuevo usuario (solo ADMIN)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol ADMIN
 */

/**
 * @swagger
 * /gestionbanco/v1/Usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /gestionbanco/v1/Usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario (solo ADMIN)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 *   delete:
 *     summary: Eliminar un usuario (solo ADMIN)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */

/**
 * @swagger
 * /gestionbanco/v1/Usuarios/confirm-delete:
 *   get:
 *     summary: Confirmar eliminación de administrador vía email
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de confirmación de eliminación
 *     responses:
 *       200:
 *         description: Eliminación confirmada
 *       400:
 *         description: Token inválido
 */

router.put('/:id', validateJWT, requireRole('ADMIN_ROLE'), updateUser);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteUser);
router.post('/create', validateJWT, requireRole('ADMIN_ROLE'), createField);
router.get('/', validateJWT, getFields);
router.get('/confirm-delete', confirmDeleteAdmin);

export default router;
