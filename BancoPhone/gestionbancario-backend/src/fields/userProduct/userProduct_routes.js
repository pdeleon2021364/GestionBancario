import { Router } from 'express';
import {
    requestProduct,
    getMyProducts,
    getAllRequests,
    getPendingRequests,
    approveRequest,
    rejectRequest,
    cancelRequest,
} from './userProduct_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

router.post('/request', validateJWT, requireRole('USER_ROLE'), requestProduct);
router.get('/my', validateJWT, requireRole('USER_ROLE'), getMyProducts);

router.get('/', validateJWT, requireRole('ADMIN_ROLE'), getAllRequests);
router.get('/pending', validateJWT, requireRole('ADMIN_ROLE'), getPendingRequests);
router.put('/approve/:id', validateJWT, requireRole('ADMIN_ROLE'), approveRequest);
router.put('/reject/:id', validateJWT, requireRole('ADMIN_ROLE'), rejectRequest);
router.put('/cancel/:id', validateJWT, cancelRequest);

export default router;
