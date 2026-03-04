validate_jwt


import jwt from 'jsonwebtoken';
import BankAccount from '../src/fields/bankAccount/bankAccount_model.js';

export const validateJWT = (req, res, next) => {

    const token =
        req.header('x-token') ||
        req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó token'
        })
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = {
            id: decoded.sub,
            role: decoded.role
        }

        next()

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        })
    }
}

export const validateClient = async (req, res, next) => {

    // Los administradores no están sujetos a esta restricción
    if (req.user.role === 'ADMIN_ROLE') {
        return next();
    }

    try {
        const account = await BankAccount.findOne({
            usuarioId: req.user.id,
            estado: 'activa'
        });

        if (!account) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo los clientes con una cuenta bancaria activa pueden acceder a este recurso.'
            });
        }

        req.clientAccount = account;
        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar la cuenta bancaria del cliente',
            error: error.message
        });
    }
}
