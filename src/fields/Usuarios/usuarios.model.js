'use strict';

import { DataTypes } from 'sequelize';
import { sequelize } from '../../../configs/db.js';

const User = sequelize.define('User', {

  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  nickname: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  rol: {
    type: DataTypes.ENUM('ADMIN_ROLE', 'USER_ROLE'),
    defaultValue: 'USER_ROLE',
  },

  DPI: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [13, 13], // El DPI guatemalteco tiene exactamente 13 dígitos
    },
  },

  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  Cellphone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 15],
    },
  },

  Monthlyincome: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 100, // Si el ingreso es menor a Q100 no se puede crear la cuenta
    },
  },

  jobname: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  emailToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  resetTokenExpiration: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  deleteToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  deleteTokenExpiration: {
    type: DataTypes.DATE,
    allowNull: true,
  },

}, {
  timestamps: true,
});

export default User;