import { Router } from 'express';
import { createTransaction, getTransactions } from './transactions_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

router.post('/create',    validateJWT,
    requireRole('ADMIN_ROLE'),createTransaction)
router.get('/', getTransactions)

export default router;
