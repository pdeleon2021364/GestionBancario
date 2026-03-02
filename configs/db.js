'use strict';

import mongoose from "mongoose";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

/* ===========================
   🔹 PostgreSQL - Sequelize
=========================== */

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

export const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL | conectado correctamente");
  } catch (error) {
    console.error("PostgreSQL | error de conexión:", error);
  }
};

/* ===========================
   🔹 MongoDB - Mongoose
=========================== */

export const dbConnection = async () => {
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