import { Router } from 'express';
import { createField, getFields } from './role_controller.js';
import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';
 // import { uploadFieldImage } from '../../middlewares/file-uploader.js';
 // import { cleanUploaderFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

router.post(
    '/create',
   //  uploadFieldImage.single('image'),
   //  cleanUploaderFileOnFinish,
      validateJWT,
       requireRole('ADMIN_ROLE'),
    createField
)

router.get(
    '/',
    getFields
)

export default router;