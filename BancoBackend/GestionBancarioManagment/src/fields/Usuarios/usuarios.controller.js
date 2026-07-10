import bcrypt from 'bcryptjs';
import User from './usuarios.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';

export const createField = async (req, res) => {
  try {

    const { password, ...data } = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...data,
      password: encryptedPassword
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'emailToken', 'resetToken', 'resetTokenExpiration', 'deleteToken', 'deleteTokenExpiration'] }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFields = async (req, res) => {
  try {

    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
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

export const updateUser = async (req, res) => {
  try {

    const { id } = req.params;
    const { nombre, email, rol } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const updateData = {
      nombre,
      email,
    };

    if (rol) {
      const allowedRoles = ['ADMIN_ROLE', 'USER_ROLE'];
      if (!allowedRoles.includes(rol)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        });
      }
      updateData.rol = rol;
    }

    await user.update(updateData);

    res.json({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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

    // Si es USER_ROLE → se elimina normal
    if (user.rol === 'USER_ROLE') {
      await user.destroy();

      return res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    }

    //  Si es ADMIN_ROLE → enviar verificación por correo
    if (user.rol === 'ADMIN_ROLE') {

      const deleteToken = crypto.randomBytes(32).toString('hex');

      user.deleteToken = deleteToken;
      user.deleteTokenExpiration = Date.now() + 3600000; // 1 hora
      await user.save();

      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const deleteLink =
        `http://localhost:${process.env.PORT}/gestionbanco/v1/Usuarios/confirm-delete?token=${deleteToken}`;

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

export const confirmDeleteAdmin = async (req, res) => {
  try {

    const { token } = req.query;

    const user = await User.findOne({
      where: {
        deleteToken: token,
        deleteTokenExpiration: {
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