import { Router } from 'express';
import { createField, getFields, updateUser,deleteUser,confirmDeleteAdmin } from './usuarios.controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';
 // import { uploadFieldImage } from '../../middlewares/file-uploader.js';
 // import { cleanUploaderFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();
router.put('/:id', validateJWT, requireRole('ADMIN_ROLE'), updateUser);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), deleteUser);

router.post(
    '/create',
   //  uploadFieldImage.single('image'),
   //  cleanUploaderFileOnFinish,
   validateJWT,
    requireRole('ADMIN_ROLE'),
    createField
)

router.get('/', validateJWT, getFields);

router.get('/confirm-delete', confirmDeleteAdmin);

export default router;