import { Router } from 'express';
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionByTipo,
    revertirDeposito 
} from './transactions_controller.js';

import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * Crear transacción
 */
router.post(
    '/create',
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

/**
 * Buscar transacción por id
 */
router.get(
    '/:id',
    getTransactionById
);

/**
 * Buscar transacción por tipo
 */
router.get(
    '/type/:tipo',
    getTransactionByTipo
);

/*revertir depsoito*/
router.post(
    '/revertir/:id',
    validateJWT,
    revertirDeposito
);

export default router;