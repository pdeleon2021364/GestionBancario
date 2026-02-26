import { Router } from 'express';
import {
  login,
  register,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  listUsers
} from './auth_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/users', listUsers);
router.get('/reset-password', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Token no proporcionado'
        });
    }

    return res.send(`
        <h1>Token recibido:</h1>
        <p>${token}</p>
    `);
});
export default router;
