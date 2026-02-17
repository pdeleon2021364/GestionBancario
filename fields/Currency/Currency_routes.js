import { Router } from 'express';
import { createCurrency, getCurrencies } from './Currency_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

router.post('/create', validateJWT,
    requireRole('ADMIN_ROLE'),createCurrency)
router.get('/', getCurrencies)

export default router;
