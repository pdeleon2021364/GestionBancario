'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { dbConnection, connectPostgres, sequelize } from './db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';

import usuariosRoutes from '../src/fields/Usuarios/usuarios.routes.js';
import bankAccountRoutes from '../src/fields/bankAccount/bankAccount_routes.js';
import roleRoutes from '../src/fields/Roles/role_routes.js';
import currencyRoutes from '../src/fields/Currency/Currency_routes.js';
import exchangeRateRoutes from '../src/fields/ExchangeRate/ExchangeRate_routes.js';
import financialproduct from '../src/fields/financialproduct/financialproduct_routes.js';
import recordRoutes from '../src/fields/record/record_routes.js';
import transactionsRoutes from '../src/fields/transactions/transactions_routes.js';
import authRoutes from '../src/fields/auth/auth_routes.js';

const BASE_PATH = '/gestionbanco/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
};

const routes = (app) => {

    app.use(`${BASE_PATH}/Usuarios`, usuariosRoutes);
    app.use(`${BASE_PATH}/bankAccount`, bankAccountRoutes);
    app.use(`${BASE_PATH}/Roles`, roleRoutes);
    app.use(`${BASE_PATH}/Currency`, currencyRoutes);
    app.use(`${BASE_PATH}/ExchangeRate`, exchangeRateRoutes);
    app.use(`${BASE_PATH}/financialproduct`, financialproduct);
    app.use(`${BASE_PATH}/record`, recordRoutes);
    app.use(`${BASE_PATH}/transactions`, transactionsRoutes);
    app.use(`${BASE_PATH}/auth`, authRoutes);

    app.get(`${BASE_PATH}/Health`, (req, res) => {
        res.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'gestionbanco'
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado en Admin API'
        });
    });
};

export const initServer = async () => {

    const app = express();
    const PORT = process.env.PORT;

    app.set('trust proxy', 1);

    try {
        await dbConnection();
        await connectPostgres();
        await sequelize.sync({ alter: true });
        middlewares(app);
        routes(app);

        app.listen(PORT, () => {
            console.log(`gestionbanco Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/Health`);
        });

    } catch (error) {
        console.error(`Error starting Server: ${error.message}`);
        process.exit(1);
    }
};