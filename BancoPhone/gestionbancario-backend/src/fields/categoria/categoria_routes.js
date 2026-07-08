import { Router } from 'express';
import { getCategorias } from './categoria_controller.js';
const router = Router();
router.get('/', getCategorias);
export default router;
