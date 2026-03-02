import { Router } from 'express';
import {
    createCurrency,
    getCurrencies,
    updateCurrency,
    deleteCurrency,
    getCurrencyByCode
} from './Currency_controller.js';

import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * Crear divisa
 */
router.post(
    '/create',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    createCurrency
);

/**
 * Listar divisas
 */
router.get(
    '/',
    getCurrencies
);

/**
 * Editar divisa
 */
router.put(
    '/update/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    updateCurrency
);

/**
 * Eliminar divisa
 */
router.delete(
    '/delete/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    deleteCurrency
);

/**
 * Obtener divisa por código
 */
router.get(
    '/code/:codigo',
    getCurrencyByCode
);

export default router;