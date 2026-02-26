import { Router } from 'express';
import {
    createExchangeRate,
    getExchangeRates,
    updateExchangeRate,
    deleteExchangeRate
} from './ExchangeRate_controller.js';

import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * Crear tipo de cambio
 */
router.post(
    '/create',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    createExchangeRate
);

/**
 * Listar tipos de cambio
 */
router.get(
    '/',
    getExchangeRates
);

/**
 * Editar tipo de cambio
 */
router.put(
    '/update/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    updateExchangeRate
);

/**
 * Eliminar tipo de cambio
 */
router.delete(
    '/delete/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    deleteExchangeRate
);

export default router;