import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../Usuarios/usuarios.model.js'

export const login = async (req, res) => {
    try {

        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            })
        }

        const validPassword = await bcrypt.compare(password, user.password)

        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            })
        }

        const payload = {
            sub: user._id,
            role: user.rol
        }

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        )

        return res.json({
            success: true,
            token
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en login',
            error: error.message
        })
    }
}
