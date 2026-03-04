financialproduct_routes


import { Router } from 'express';
import {
    createFinancialProduct,
    getFinancialProducts,
    updateFinancialProduct,
    deleteFinancialProduct,
    getFinancialProductById,
    getFinancialProductByName

} from './financialproduct_controller.js';

import { validateJWT, validateClient } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();


router.use(validateJWT);
router.use(validateClient);


router.post(
    '/create',
    requireRole('ADMIN_ROLE'),
    createFinancialProduct
);


router.get('/', getFinancialProducts);


router.get('/name/:nombre', getFinancialProductByName);


router.get('/:id', getFinancialProductById);


router.put(
    '/update/:id',
    requireRole('ADMIN_ROLE'),
    updateFinancialProduct
);


router.delete(
    '/delete/:id',
    requireRole('ADMIN_ROLE'),
    deleteFinancialProduct
);

export default router;
