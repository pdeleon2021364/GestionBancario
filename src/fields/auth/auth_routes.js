import { Router } from 'express'
import { login } from './auth_controller.js'

const router = Router()

router.post('/login', login)

export default router
