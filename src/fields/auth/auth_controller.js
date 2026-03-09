import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import User from '../Usuarios/usuarios.model.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
          tls: { rejectUnauthorized: false }

});

const emailTemplate = ({ title, message, buttonText, link, color }) => {
    return `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">

            <table width="500" style="background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 6px 18px rgba(0,0,0,0.08);">

              <tr>
                <td align="center">
                  <h2 style="margin:0; color:#1e293b;">GestionBanco</h2>
                  <p style="color:#64748b; margin-top:5px;">${title}</p>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 0; color:#334155; font-size:15px; line-height:1.6;">
                  ${message}
                </td>
              </tr>

              <tr>
                <td align="center">
                  <a href="${link}" 
                     style="
                      background:${color};
                      color:#ffffff;
                      padding:14px 28px;
                      border-radius:8px;
                      text-decoration:none;
                      font-weight:bold;
                      display:inline-block;
                      font-size:14px;
                     ">
                    ${buttonText}
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding-top:25px; font-size:13px; color:#94a3b8;">
                  Si el botón no funciona copia este enlace:<br>
                  <span style="word-break:break-all;">${link}</span>
                </td>
              </tr>

              <tr>
                <td style="padding-top:30px; font-size:12px; color:#94a3b8; text-align:center;">
                  © ${new Date().getFullYear()} GestionBanco - Todos los derechos reservados
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </div>
    `;
};



export const register = async (req, res) => {
    // Este endpoint ya NO debe usarse para crear clientes.
    // Los clientes los crea el admin desde /usuarios/create
    // Aquí solo se crea el primer ADMIN si no existe ninguno (seed inicial)
    try {

        const totalUsers = await User.count();

        if (totalUsers > 0) {
            return res.status(403).json({
                success: false,
                message: 'El registro público no está disponible. Contacta al administrador.'
            });
        }

        // Solo se ejecuta si la base de datos está vacía → crea el ADMIN inicial
        const { nombre, email, password } = req.body;

        const encryptedPassword = await bcrypt.hash(password, 10);
        const emailToken = crypto.randomBytes(32).toString('hex');

        await User.create({
            username: 'ADMINB',
            nombre,
            email,
            password: encryptedPassword,
            rol: 'ADMIN_ROLE',
            emailToken,
            emailVerified: false,
            DPI: '0000000000000',      // Valor placeholder para el admin
            direccion: 'Administración',
            Cellphone: '00000000',
            Monthlyincome: 99999,
            jobname: 'Administrador'
        });

        const verifyLink = `http://localhost:${process.env.PORT}/gestionbanco/v1/auth/verify-email?token=${emailToken}`;

        await transporter.sendMail({
            from: `"Banco Digital" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verifica tu cuenta - GestionBanco',
            html: emailTemplate({
                title: 'Verificación de cuenta',
                message: `Hola 👋 <br><br>Tu cuenta de administrador ha sido creada.<br>Para activarla haz clic en el botón:`,
                buttonText: 'Verificar cuenta',
                link: verifyLink,
                color: '#2563eb'
            })
        });

        res.status(201).json({
            success: true,
            message: 'Administrador inicial creado. Revisa tu correo para verificar tu cuenta.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* ===========================
   RESEND VERIFICATION EMAIL
=========================== */

export const resendVerification = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar un correo'
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'La cuenta ya está verificada'
            });
        }

        // Generar nuevo token
        const newEmailToken = crypto.randomBytes(32).toString('hex');
        user.emailToken = newEmailToken;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const verifyLink =
            `http://localhost:${process.env.PORT}/gestionbanco/v1/auth/verify-email?token=${newEmailToken}`;

            await transporter.sendMail({
            from: `"Banco Digital" <${process.env.EMAIL_USER}>`,

            to: email,
            subject: 'Verifica tu cuenta - GestionBanco',
            html: emailTemplate({
                title: 'Verificación de cuenta',
                message: `
                  Hola 👋 <br><br>
                  Gracias por registrarte en <b>GestionBanco</b>.<br>
                  Para activar tu cuenta haz clic en el botón:
                `,
                buttonText: 'Verificar cuenta',
                link: verifyLink,
                color: '#2563eb'
            })
        });

        return res.json({
            success: true,
            message: 'Correo de verificación reenviado correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* ===========================
   LOGIN
=========================== */

export const login = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Permite login con email O con username
        const whereClause = email ? { email } : { username };

        const user = await User.findOne({ where: whereClause });

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

        const token = jwt.sign(
            { sub: user.id, role: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            success: true,
            token,
            rol: user.rol  
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

        const token = req.body?.token || req.query?.token;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const user = await User.findOne({ where: { emailToken: token } });

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

        const user = await User.findOne({ where: { email } });

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

        const resetLink =
            `http://localhost:${process.env.PORT}/gestionbanco/v1/auth/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: `"Banco Digital" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Recuperación de contraseña - GestionBanco',
            html: emailTemplate({
                title: 'Restablecer contraseña',
                message: `
                  Hola 👋 <br><br>
                  Recibimos una solicitud para cambiar tu contraseña.<br>
                  Si fuiste tú, haz clic en el botón:
                `,
                buttonText: 'Restablecer contraseña',
                link: resetLink,
                color: '#ef4444'
            })
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

/* ===========================
   LIST USERS
=========================== */

export const listUsers = async (req, res) => {
    try {

        const { page = 1, limit = 10 } = req.query;

        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
        const offset = (safePage - 1) * safeLimit;

        const { rows, count } = await User.findAndCountAll({
            attributes: { exclude: ['password', 'emailToken', 'resetToken', 'resetTokenExpiration'] },
            limit: safeLimit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                currentPage: safePage,
                totalPages: Math.ceil(count / safeLimit),
                totalRecords: count,
                limit: safeLimit
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};