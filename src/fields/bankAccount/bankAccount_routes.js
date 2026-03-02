import { Router } from 'express';
import {
    createField,
    getFields,
    updateField,
    deleteField,
    getAccountByAccountNumber,
     sendAllBankAccountsPDF,  
    sendBankAccountPDFById 
} from './bankAccount_controller.js';

import { validateJWT } from '../../../middlewares/validate_jwt.js';
import { requireRole } from '../../../middlewares/validate_role.js';
// import { uploadFieldImage } from '../../middlewares/file-uploader.js';
// import { cleanUploaderFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

/**
 * Crear cuenta bancaria
 */
router.post(
    '/create',
    // uploadFieldImage.single('image'),
    // cleanUploaderFileOnFinish,
    validateJWT,
    createField
);

/**
 * Listar cuentas bancarias
 */
router.get(
    '/',
    getFields
);

/**
 * Editar cuenta bancaria
 */
router.put(
    '/update/:id',
    validateJWT,
    updateField
);

/**
 * Eliminar cuenta bancaria
 */
router.delete(
    '/delete/:id',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    deleteField
);

/**
 * Buscar cuentas bancarias
 */
router.get('/search/:accountNumber', getAccountByAccountNumber);
router.get('/search/numero/:numeroCuenta', getAccountByAccountNumber);

router.get(
    '/send-pdf/all/:email',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    sendAllBankAccountsPDF
);

/**
 * Enviar PDF de UNA cuenta bancaria específica al correo indicado
 */
router.get(
    '/send-pdf/:id/:email',
    validateJWT,
    requireRole('ADMIN_ROLE'),
    sendBankAccountPDFById
);

export default router;
