import { Router } from 'express';
import { createExchangeRate, getExchangeRates } from './ExchangeRate_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

router.post('/create', validateJWT,
    requireRole('ADMIN_ROLE'),createExchangeRate)
router.get('/', getExchangeRates)

export default router;
