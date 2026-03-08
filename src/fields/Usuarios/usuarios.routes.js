import { Router } from 'express';
import { createField, getFields, updateUser, deleteUser, confirmDeleteAdmin, updateMiCuenta } from './usuarios.controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

// se pone antes el id del usuario
router.put('/mi-cuenta', validateJWT, updateMiCuenta);

router.put('/:id', validateJWT, requireRole('ADMIN_ROLE'), updateUser);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteUser);

router.post(
    '/create',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    createField
);

router.get('/', validateJWT, getFields);

router.get('/confirm-delete', confirmDeleteAdmin);

export default router;
