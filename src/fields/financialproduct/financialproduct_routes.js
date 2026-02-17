import { Router } from 'express';
import { createFinancialProduct, getFinancialProducts } from './financialproduct_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

router.post('/create',   validateJWT,
    requireRole('ADMIN_ROLE'), createFinancialProduct)
router.get('/', getFinancialProducts)

export default router;
