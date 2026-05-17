import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/user.model.js';
import { uploadImage, deleteImage, getDefaultAvatarUrl } from '../services/cloudinary.service.js';
import { deleteLocalFile } from '../services/file-upload.service.js';
import { buildUserResponse } from '../helpers/user.helper.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const buildVerificationEmail = (verifyLink) => `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="500" style="background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 6px 18px rgba(0,0,0,0.08);">
          <tr>
            <td align="center">
              <h2 style="margin:0; color:#1e293b;">GestionBanco</h2>
              <p style="color:#64748b; margin-top:5px;">Verificación de cuenta</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0; color:#334155; font-size:15px; line-height:1.6;">
              Gracias por registrarte en <strong>GestionBanco</strong>.<br>
              Haz clic en el botón para verificar tu cuenta.
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="${verifyLink}" style="background:#2563eb; color:#ffffff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block; font-size:14px;">
                Verificar cuenta
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:25px; font-size:13px; color:#94a3b8;">
              Si el botón no funciona copia este enlace:<br>
              <span style="word-break:break-all;">${verifyLink}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;

const isValidHttpUrl = (value) => {
  try {
    return Boolean(value && new URL(value));
  } catch {
    return false;
  }
};

export const register = async (req, res) => {
  try {
    const { nombre, email, password, profilePictureUrl } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'nombre, email y password son obligatorios'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    let profilePicture = null;

    if (req.file) {
      try {
        const publicId = `profile-${uuidv4()}`;
        const uploadResult = await uploadImage(req.file.path, publicId);
        profilePicture = uploadResult.public_id;
      } catch (error) {
        console.error('Error subiendo imagen a Cloudinary:', error);
      } finally {
        await deleteLocalFile(req.file.path);
      }
    } else if (profilePictureUrl && isValidHttpUrl(profilePictureUrl)) {
      profilePicture = profilePictureUrl;
    }

    const emailToken = crypto.randomBytes(32).toString('hex');
    const totalUsers = await User.count();
    const rol = totalUsers === 0 ? 'ADMIN_ROLE' : 'USER_ROLE';

    const user = await User.create({
      nombre,
      email,
      password: encryptedPassword,
      rol,
      emailToken,
      emailVerified: false,
      profilePicture
    });

    const verifyLink = `http://localhost:${process.env.PORT || 3006}/gestionbanco/v1/auth/verify-email?token=${emailToken}`;
    const transporter = createTransporter();

    transporter.sendMail({
      from: `"Banco Digital" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verifica tu cuenta - GestionBanco',
      html: buildVerificationEmail(verifyLink)
    }).catch(error => {
      console.error('No se pudo enviar correo de verificación:', error);
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nombre, profilePictureUrl, removePhoto } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    let profilePicture = user.profilePicture;
    const externalPhoto = profilePictureUrl && isValidHttpUrl(profilePictureUrl);
    const shouldRemove = removePhoto === 'true' || removePhoto === true || removePhoto === '1';

    if (req.file) {
      try {
        const publicId = `profile-${uuidv4()}`;
        const uploadResult = await uploadImage(req.file.path, publicId);
        if (profilePicture && !isValidHttpUrl(profilePicture)) {
          await deleteImage(profilePicture);
        }
        profilePicture = uploadResult.public_id;
      } catch (error) {
        await deleteLocalFile(req.file.path);
        console.error('Error actualizando imagen en Cloudinary:', error);
        return res.status(503).json({
          success: false,
          message: 'No se pudo actualizar la imagen de perfil. Intenta más tarde.'
        });
      } finally {
        await deleteLocalFile(req.file.path);
      }
    } else if (externalPhoto) {
      if (profilePicture && !isValidHttpUrl(profilePicture)) {
        await deleteImage(profilePicture);
      }
      profilePicture = profilePictureUrl;
    } else if (shouldRemove) {
      if (profilePicture && !isValidHttpUrl(profilePicture)) {
        await deleteImage(profilePicture);
      }
      profilePicture = null;
    }

    const updatedUser = await user.update({
      nombre: nombre || user.nombre,
      profilePicture
    });

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: buildUserResponse(updatedUser)
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};
