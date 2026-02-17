import jwt from 'jsonwebtoken'

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
