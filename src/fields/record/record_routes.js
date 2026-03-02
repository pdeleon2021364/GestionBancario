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
 * Crear historial
 */
router.post(
    '/create',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    createRecord
);

/**
 * Listar historiales
 */
router.get(
    '/',
    getRecords
);

/**
 * Editar historial
 */
router.put(
    '/update/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    updateRecord
);

/**
 * Eliminar historial
 */
router.delete(
    '/delete/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    deleteRecord
);

/**
 * Buscar historial por cuenta
 */
router.get('/account/:cuentaId', getRecordsByAccount);

/**
 * Buscar historial por id
 */
router.get('/:id', getRecordById);

export default router;