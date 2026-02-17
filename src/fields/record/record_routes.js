import { Router } from 'express';
import { createRecord, getRecords } from './record_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

router.post('/create',    validateJWT,
    requireRole('ADMIN_ROLE'),createRecord)
router.get('/', getRecords)

export default router;
