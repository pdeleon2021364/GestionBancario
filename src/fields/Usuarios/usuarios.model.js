'use strict';

import { DataTypes } from 'sequelize';
import { sequelize } from '../../../configs/db.js';

const User = sequelize.define('User', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('ADMIN_ROLE', 'USER_ROLE'),
    defaultValue: 'USER_ROLE',
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
}
}, {
  timestamps: true,
});

export default User;