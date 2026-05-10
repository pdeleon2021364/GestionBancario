'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { dbConnection } from './db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { setupSwagger } from './swagger.js';

import exchangeRateRoutes from '../src/exchangeRate_routes.js';

const BASE_PATH = '/exchangerate/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
};

const routes = (app) => {
    setupSwagger(app);

    app.use(`${BASE_PATH}/ExchangeRate`, exchangeRateRoutes);

    app.get(`${BASE_PATH}/Health`, (req, res) => {
        res.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'exchangerate-service'
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado en ExchangeRate API'
        });
    });
};

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT;

    app.set('trust proxy', 1);

    try {
        await dbConnection();
        middlewares(app);
        routes(app);

        app.listen(PORT, () => {
            console.log(`exchangerate-service Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/Health`);
        });
    } catch (error) {
        console.error(`Error starting Server: ${error.message}`);
        process.exit(1);
    }
};
