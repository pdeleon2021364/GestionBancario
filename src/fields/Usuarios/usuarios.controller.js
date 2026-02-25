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
    const { nombre, email } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.update({ nombre, email });

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

    // 🟢 Si es USER_ROLE → se elimina normal
    if (user.rol === 'USER_ROLE') {
      await user.destroy();

      return res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    }

    // 🔴 Si es ADMIN_ROLE → enviar verificación por correo
    if (user.rol === 'ADMIN_ROLE') {

      const deleteToken = crypto.randomBytes(32).toString('hex');

      user.deleteToken = deleteToken;
      user.deleteTokenExpiration = Date.now() + 3600000; // 1 hora
      await user.save();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
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