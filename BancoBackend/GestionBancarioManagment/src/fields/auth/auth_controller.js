import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import User from '../Usuarios/usuarios.model.js';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const emailTemplate = ({ title, message, buttonText, link, color }) => `
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
                <a href="${link}" style="background:${color}; color:#ffffff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block; font-size:14px;">${buttonText}</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:25px; font-size:13px; color:#94a3b8;">
                Si el botón no funciona copia este enlace:<br>
                <span style="word-break:break-all;">${link}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top:30px; font-size:12px; color:#94a3b8; text-align:center;">© ${new Date().getFullYear()} GestionBanco - Todos los derechos reservados</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

/* ===========================
   REGISTER
=========================== */
export const register = async (req, res) => {
  try {
    const { nombre, name, email, password, surname } = req.body;
    const resolvedName = typeof nombre === 'string' && nombre.trim()
      ? nombre.trim()
      : [name, surname].filter(Boolean).join(' ').trim();

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ success: false, message: 'El correo ya está registrado' });

    const encryptedPassword = await bcrypt.hash(password, 10);
    const emailToken = crypto.randomBytes(32).toString('hex');

    const totalUsers = await User.count();
    const rol = totalUsers === 0 ? 'ADMIN_ROLE' : 'USER_ROLE';

    await User.create({ nombre: resolvedName, email, password: encryptedPassword, rol, emailToken, emailVerified: false });

    const verifyLink = `http://localhost:${process.env.PORT || 3006}/gestionbanco/v1/auth/verify-email?token=${emailToken}`;

    await transporter.sendMail({ from: `"Banco Digital" <${process.env.EMAIL_USER}>`, to: email, subject: 'Verifica tu cuenta - GestionBanco', html: emailTemplate({ title: 'Verificación de cuenta', message: `Hola 👋 <br><br>Gracias por registrarte en <b>GestionBanco</b>.<br>Para activar tu cuenta haz clic en el botón:`, buttonText: 'Verificar cuenta', link: verifyLink, color: '#2563eb' }) });

    res.status(201).json({ success: true, message: 'Usuario creado. Revisa tu correo para verificar tu cuenta.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===========================
   RESEND VERIFICATION EMAIL
=========================== */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Debes proporcionar un correo' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (user.emailVerified) return res.status(400).json({ success: false, message: 'La cuenta ya está verificada' });

    const newEmailToken = crypto.randomBytes(32).toString('hex');
    user.emailToken = newEmailToken;
    await user.save();

    const verifyLink = `http://localhost:${process.env.PORT || 3006}/gestionbanco/v1/auth/verify-email?token=${newEmailToken}`;
    await transporter.sendMail({ from: `"Banco Digital" <${process.env.EMAIL_USER}>`, to: email, subject: 'Verifica tu cuenta - GestionBanco', html: emailTemplate({ title: 'Verificación de cuenta', message: `Hola 👋 <br><br>Gracias por registrarte en <b>GestionBanco</b>.<br>Para activar tu cuenta haz clic en el botón:`, buttonText: 'Verificar cuenta', link: verifyLink, color: '#2563eb' }) });

    return res.json({ success: true, message: 'Correo de verificación reenviado correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ===========================
   LOGIN
=========================== */
export const login = async (req, res) => {
  try {
    const { email, password, emailOrUsername, username } = req.body;
    const identifier = email || emailOrUsername || username;
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          ...(identifier ? [{ nombre: identifier }] : []),
        ],
      },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Credenciales inválidas' });

    const allowUnverifiedLogin = process.env.ALLOW_UNVERIFIED_LOGIN === 'true' || process.env.NODE_ENV !== 'production';
    if (!user.emailVerified && !allowUnverifiedLogin) {
      return res.status(403).json({ success: false, message: 'Debes verificar tu correo primero' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ success: false, message: 'Credenciales inválidas' });

    const payload = { sub: user.id, role: user.rol };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
    user.refreshToken = refreshToken;
    user.refreshTokenExpiration = refreshTokenExpiration;
    await user.save();

    const userDetails = { id: user.id, nombre: user.nombre, email: user.email, role: user.rol, profilePicture: user.profilePicture, emailVerified: user.emailVerified, createdAt: user.createdAt, updatedAt: user.updatedAt };

    res.json({ success: true, accessToken, token: accessToken, refreshToken, expiresIn: 2 * 60 * 60, userDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en login', error: error.message });
  }
};

/* ===========================
   REFRESH TOKEN
=========================== */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token no proporcionado' });

    const user = await User.findOne({ where: { refreshToken } });
    if (!user || !user.refreshTokenExpiration || user.refreshTokenExpiration < Date.now()) return res.status(401).json({ success: false, message: 'Refresh token inválido o expirado' });

    const payload = { sub: user.id, role: user.rol };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await user.save();

    const userDetails = { id: user.id, nombre: user.nombre, email: user.email, role: user.rol, profilePicture: user.profilePicture, emailVerified: user.emailVerified, createdAt: user.createdAt, updatedAt: user.updatedAt };

    res.json({ success: true, accessToken: newAccessToken, token: newAccessToken, refreshToken: newRefreshToken, expiresIn: 2 * 60 * 60, userDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en refresh token', error: error.message });
  }
};

/* ===========================
   VERIFY EMAIL
=========================== */
export const verifyEmail = async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;
    if (!token) return res.status(400).json({ success: false, message: 'Token no proporcionado' });
    const user = await User.findOne({ where: { emailToken: token } });
    if (!user) return res.status(400).json({ success: false, message: 'Token inválido' });
    user.emailVerified = true; user.emailToken = null; await user.save();
    res.json({ success: true, message: 'Correo verificado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===========================
   REQUEST & RESET PASSWORD
=========================== */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'No existe usuario con ese correo' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken; user.resetTokenExpiration = Date.now() + 3600000; await user.save();

    const resetLink = `http://localhost:${process.env.PORT || 3006}/gestionbanco/v1/auth/reset-password?token=${resetToken}`;
    await transporter.sendMail({ from: `"Banco Digital" <${process.env.EMAIL_USER}>`, to: user.email, subject: 'Recuperación de contraseña - GestionBanco', html: emailTemplate({ title: 'Restablecer contraseña', message: `Hola 👋 <br><br>Recibimos una solicitud para cambiar tu contraseña.<br>Si fuiste tú, haz clic en el botón:`, buttonText: 'Restablecer contraseña', link: resetLink, color: '#ef4444' }) });

    res.json({ success: true, message: 'Correo de recuperación enviado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ where: { resetToken: token, resetTokenExpiration: { [Op.gt]: Date.now() } } });
    if (!user) return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    user.password = encryptedPassword; user.resetToken = null; user.resetTokenExpiration = null; await user.save();
    res.json({ success: true, message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    const { rows, count } = await User.findAndCountAll({ attributes: { exclude: ['password', 'emailToken', 'resetToken', 'resetTokenExpiration'] }, limit: safeLimit, offset, order: [['createdAt', 'DESC']] });

    return res.status(200).json({ success: true, data: rows, pagination: { currentPage: safePage, totalPages: Math.ceil(count / safeLimit), totalRecords: count, limit: safeLimit } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
