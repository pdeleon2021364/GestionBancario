'use strict';

import mongoose from "mongoose";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

/* ===========================
   🔹 PostgreSQL - Sequelize
=========================== */

const dialect = process.env.DB_DIALECT || 'postgres';
const sequelizeOptions = {
  dialect,
  logging: false,
};

if (dialect === 'postgres') {
  sequelizeOptions.host = process.env.DB_HOST;
  sequelizeOptions.port = process.env.DB_PORT;
} else if (dialect === 'sqlite') {
  sequelizeOptions.storage = process.env.DB_STORAGE || './database.sqlite';
}

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'gestionbanco',
  process.env.DB_USER || 'admin',
  process.env.DB_PASS || 'admin123',
  sequelizeOptions
);

export const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Sequelize (${dialect}) | conectado correctamente`);
  } catch (error) {
    console.error(`Sequelize (${dialect}) | error de conexión:`, error);
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