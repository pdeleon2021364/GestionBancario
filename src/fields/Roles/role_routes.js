import { Router } from 'express';
import {
    createField,
    getFields,
    updateField,
    deleteField
} from './role_controller.js';

import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';
// import { uploadFieldImage } from '../../middlewares/file-uploader.js';
// import { cleanUploaderFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

/**
 * Crear campo (rol)
 */
router.post(
    '/create',
    // uploadFieldImage.single('image'),
    // cleanUploaderFileOnFinish,
    validateJWT,
    requireRole('ADMIN_ROLE'),
    createField
);

/**
 * Listar campos (roles)
 */
router.get(
    '/',
    getFields
);

/**
 * Editar campo (rol)
 */
router.put(
    '/update/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    updateField
);

/**
 * Eliminar campo (rol)
 */
router.delete(
    '/delete/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    deleteField
);

export default router;