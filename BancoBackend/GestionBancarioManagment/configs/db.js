'use strict';

import mongoose from "mongoose";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

/* ===========================
   🔹 PostgreSQL - Sequelize
=========================== */

const createSequelizeClient = (dialectName = (process.env.DB_FORCE_POSTGRES === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_DIALECT === 'postgres')) ? 'postgres' : 'sqlite') => {
  const sequelizeOptions = {
    dialect: dialectName,
    logging: false,
  };

  if (dialectName === 'postgres') {
    sequelizeOptions.host = process.env.DB_HOST || 'localhost';
    sequelizeOptions.port = Number(process.env.DB_PORT || 5432);
    sequelizeOptions.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  } else if (dialectName === 'sqlite') {
    sequelizeOptions.storage = process.env.DB_STORAGE || './database.sqlite';
  }

  return new Sequelize(
    process.env.DB_NAME || 'gestionbanco',
    process.env.DB_USER || 'admin',
    process.env.DB_PASS || 'admin123',
    sequelizeOptions
  );
};

export let sequelize = createSequelizeClient();

export const connectPostgres = async () => {
  const activeDialect = (process.env.DB_FORCE_POSTGRES === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_DIALECT === 'postgres')) ? 'postgres' : 'sqlite';

  if (sequelize.getDialect() !== activeDialect) {
    sequelize = createSequelizeClient(activeDialect);
  }

  try {
    await sequelize.authenticate();
    console.log(`Sequelize (${activeDialect}) | conectado correctamente`);
  } catch (error) {
    if (activeDialect === 'postgres' && process.env.NODE_ENV !== 'production') {
      console.warn('PostgreSQL no disponible, activando respaldo SQLite para desarrollo local.');
      sequelize = createSequelizeClient('sqlite');
      await sequelize.authenticate();
      console.log('Sequelize (sqlite) | conectado correctamente');
    } else {
      console.error(`Sequelize (${activeDialect}) | error de conexión:`, error);
      throw error;
    }
  }
};

/* ===========================
   🔹 MongoDB - Mongoose
=========================== */

export const dbConnection = async () => {
  if (!process.env.URI_MONGO) {
    console.log('MongoDB | URI_MONGO no configurada, se omite la conexión.');
    return;
  }

  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB | conectado correctamente");
    });

    mongoose.connection.on("error", () => {
      console.log("MongoDB | error de conexión");
      mongoose.disconnect();
    });

    await mongoose.connect(process.env.URI_MONGO, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
  } catch (error) {
    console.log(`Error al conectar MongoDB: ${error}`);
  }
};



const gracefulShutdown = async (signal) => {
  console.log(`Recibido ${signal}. Cerrando conexiones...`);
  await mongoose.connection.close();
  await sequelize.close();
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));