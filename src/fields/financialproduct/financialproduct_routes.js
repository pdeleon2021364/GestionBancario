import { Router } from 'express';
import {
    createFinancialProduct,
    getFinancialProducts,
    updateFinancialProduct,
    deleteFinancialProduct
} from './financialproduct_controller.js';

import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

/**
 * Crear producto financiero
 */
router.post(
    '/create',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    createFinancialProduct
);

/**
 * Listar productos financieros
 */
router.get(
    '/',
    getFinancialProducts
);

/**
 * Editar producto financiero
 */
router.put(
    '/update/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    updateFinancialProduct
);

/**
 * Eliminar producto financiero
 */
router.delete(
    '/delete/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    deleteFinancialProduct
);

export default router;