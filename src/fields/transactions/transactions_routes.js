import { Router } from 'express';
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
} from './transactions_controller.js';

import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * Crear transacción
 */
router.post(
    '/create',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    createTransaction
);

/**
 * Listar transacciones
 */
router.get(
    '/',
    getTransactions
);

/**
 * Editar transacción
 */
router.put(
    '/update/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    updateTransaction
);

/**
 * Eliminar transacción
 */
router.delete(
    '/delete/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    deleteTransaction
);

export default router;