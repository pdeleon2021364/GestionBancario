import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import User from '../Usuarios/usuarios.model.js';

/* ===========================
   REGISTER
=========================== */

export const register = async (req, res) => {
    try {

        const { nombre, email, password } = req.body;

        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);
        const emailToken = crypto.randomBytes(32).toString('hex');



        const totalUsers = await User.count();

        const rol = totalUsers === 0 ? 'ADMIN_ROLE' : 'USER_ROLE';

        await User.create({
            nombre,
            email,
            password: encryptedPassword,
            rol,
            emailToken,
            emailVerified: false
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const verifyLink =
            `http://localhost:${process.env.PORT}/gestionbanco/v1/auth/verify-email?token=${emailToken}`;

        await transporter.sendMail({
            to: email,
            subject: 'Verifica tu cuenta',
            html: `
        <h2>Bienvenido a GestionBanco</h2>
        <p>Haz click para verificar tu cuenta:</p>
        <a href="${verifyLink}">${verifyLink}</a>
      `
        });

        res.status(201).json({
            success: true,
            message: 'Usuario creado. Revisa tu correo para verificar tu cuenta.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



export const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Debes verificar tu correo primero'
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const payload = {
            sub: user.id,
            role: user.rol
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            success: true,
            token
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en login',
            error: error.message
        });
    }
};

/* ===========================
   VERIFY EMAIL
=========================== */

export const verifyEmail = async (req, res) => {
    try {

        const { token } = req.query;

        const user = await User.findOne({
            where: { emailToken: token }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        user.emailVerified = true;
        user.emailToken = null;

        await user.save();

        res.json({
            success: true,
            message: 'Correo verificado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* ===========================
   REQUEST RESET PASSWORD
=========================== */

export const requestPasswordReset = async (req, res) => {
    try {

        const { email } = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No existe usuario con ese correo'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000;

        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetLink =
            `http://localhost:${process.env.PORT}/gestionbanco/v1/auth/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            to: user.email,
            subject: 'Recuperación de contraseña',
            html: `
        <h2>Restablecer contraseña</h2>
        <p>Haz click en el siguiente enlace:</p>
        <a href="${resetLink}">${resetLink}</a>
      `
        });

        res.json({
            success: true,
            message: 'Correo de recuperación enviado'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



/* ===========================
   RESET PASSWORD
=========================== */

export const resetPassword = async (req, res) => {
    try {

        const { token, newPassword } = req.body;

        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpiration: {
                    [Op.gt]: Date.now()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        user.password = encryptedPassword;
        user.resetToken = null;
        user.resetTokenExpiration = null;

        await user.save();

        res.json({
            success: true,
            message: 'Contraseña restablecida correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};