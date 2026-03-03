import bcrypt from 'bcryptjs';
import User from './usuarios.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';

// =============================================
// CREAR USUARIO (solo Admin)
// =============================================
export const createField = async (req, res) => {
  try {
    const {
      password,
      username,
      nickname,
      nombre,
      email,
      DPI,
      direccion,
      Cellphone,
      Monthlyincome,
      jobname,
      rol
    } = req.body;

    // Validación manual de ingresos mínimos (mensaje más claro que el del modelo)
    if (!Monthlyincome || parseFloat(Monthlyincome) < 100) {
      return res.status(400).json({
        success: false,
        message: 'El ingreso mensual debe ser mayor o igual a Q100'
      });
    }

    // Verificar que no exista el username
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'El username ya está en uso'
      });
    }

    // Verificar que no exista el DPI
    const existingDPI = await User.findOne({ where: { DPI } });
    if (existingDPI) {
      return res.status(400).json({
        success: false,
        message: 'El DPI ya está registrado'
      });
    }

    // Verificar que no exista el email
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      nickname,
      nombre,
      email,
      password: encryptedPassword,
      DPI,
      direccion,
      Cellphone,
      Monthlyincome,
      jobname,
      rol: rol || 'USER_ROLE',
      emailVerified: true  // El admin crea la cuenta, no necesita verificar email
    });

    // No devolver la contraseña en la respuesta
    const { password: _, ...userData } = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userData
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// OBTENER TODOS LOS USUARIOS (Admin)
// =============================================
export const getFields = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      attributes: { exclude: ['password', 'emailToken', 'resetToken', 'resetTokenExpiration', 'deleteToken', 'deleteTokenExpiration'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// ACTUALIZAR USUARIO
// Admin puede editar todo EXCEPTO DPI y password
// Cliente solo puede editar nombre, direccion, jobname, Monthlyincome
// =============================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Campos que NADIE puede modificar
    const { DPI, password, rol, ...body } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si quien edita es un cliente, solo puede editar sus propios datos y campos limitados
    if (req.user.role === 'USER_ROLE') {

      // Solo puede editar su propia cuenta
      if (req.user.sub !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para editar este usuario'
        });
      }

      // Solo estos campos puede tocar el cliente
      const { nombre, direccion, jobname, Monthlyincome } = body;

      if (Monthlyincome && parseFloat(Monthlyincome) < 100) {
        return res.status(400).json({
          success: false,
          message: 'El ingreso mensual debe ser mayor o igual a Q100'
        });
      }

      await user.update({ nombre, direccion, jobname, Monthlyincome });

    } else {
      // Admin puede editar todo menos DPI y password (ya los excluimos arriba)
      await user.update(body);
    }

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// ELIMINAR USUARIO (solo Admin)
// =============================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No puede eliminarse a sí mismo
    if (req.user.sub === user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo'
      });
    }

    // Cliente → eliminar directo
    if (user.rol === 'USER_ROLE') {
      await user.destroy();
      return res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    }

    // Admin → confirmación por correo
    if (user.rol === 'ADMIN_ROLE') {
      const deleteToken = crypto.randomBytes(32).toString('hex');

      user.deleteToken = deleteToken;
      user.deleteTokenExpiration = Date.now() + 3600000;
      await user.save();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const deleteLink = `http://localhost:${process.env.PORT}/gestionbanco/v1/Usuarios/confirm-delete?token=${deleteToken}`;

      await transporter.sendMail({
        to: user.email,
        subject: 'Confirmación eliminación de ADMIN',
        html: `
          <h2>Confirmar eliminación</h2>
          <p>Haz click para confirmar eliminación del administrador:</p>
          <a href="${deleteLink}">${deleteLink}</a>
        `
      });

      return res.json({
        success: true,
        message: 'Se envió correo de confirmación para eliminar ADMIN'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// CONFIRMAR ELIMINACIÓN DE ADMIN (via token en correo)
// =============================================
export const confirmDeleteAdmin = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      where: {
        deleteToken: token,
        deleteTokenExpiration: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Administrador eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
