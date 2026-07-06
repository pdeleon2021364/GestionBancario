import { Router } from 'express';
import { upload, handleUploadError } from '../services/file-upload.service.js';
import { register, getProfile, updateProfile } from '../controllers/users.controller.js';
import { validateJWT } from '../../middlewares/validate_jwt.js';

const router = Router();

router.post('/register', upload.single('profilePicture'), register);
router.get('/profile', validateJWT, getProfile);
router.put('/profile', validateJWT, upload.single('profilePicture'), updateProfile);

router.use(handleUploadError);

export default router;
