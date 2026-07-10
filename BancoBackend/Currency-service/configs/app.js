'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { dbConnection } from './db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';

// Importar Swagger 
import { setupSwagger } from './swagger.js';
import Currency from '../src/Currency_model.js';

import currencyRoutes from '../src/Currency_routes.js';

const BASE_PATH = '/currency/v1';

const defaultCurrencies = [
  { nombre: 'Quetzal', codigo: 'GTQ', simbolo: 'Q' },
  { nombre: 'Dólar estadounidense', codigo: 'USD', simbolo: '$' },
  { nombre: 'Euro', codigo: 'EUR', simbolo: '€' },
  { nombre: 'Libra esterlina', codigo: 'GBP', simbolo: '£' },
  { nombre: 'Yen japonés', codigo: 'JPY', simbolo: '¥' },
  { nombre: 'Dólar canadiense', codigo: 'CAD', simbolo: 'CA$' },
  { nombre: 'Dólar australiano', codigo: 'AUD', simbolo: 'AU$' },
  { nombre: 'Franco suizo', codigo: 'CHF', simbolo: 'CHF' },
  { nombre: 'Yuan chino', codigo: 'CNY', simbolo: '¥' },
  { nombre: 'Peso mexicano', codigo: 'MXN', simbolo: '$' },
  { nombre: 'Real brasileño', codigo: 'BRL', simbolo: 'R$' },
  { nombre: 'Peso argentino', codigo: 'ARS', simbolo: '$' },
  { nombre: 'Peso colombiano', codigo: 'COP', simbolo: '$' },
  { nombre: 'Sol peruano', codigo: 'PEN', simbolo: 'S/' },
  { nombre: 'Dólar de Singapur', codigo: 'SGD', simbolo: 'S$' },
  { nombre: 'Dólar neozelandés', codigo: 'NZD', simbolo: 'NZ$' },
  { nombre: 'Rupia india', codigo: 'INR', simbolo: '₹' },
  { nombre: 'Won surcoreano', codigo: 'KRW', simbolo: '₩' },
  { nombre: 'Corona sueca', codigo: 'SEK', simbolo: 'kr' },
  { nombre: 'Corona noruega', codigo: 'NOK', simbolo: 'kr' }
];

const seedDefaultCurrencies = async () => {
  try {
    for (const currency of defaultCurrencies) {
      await Currency.findOneAndUpdate(
        { codigo: currency.codigo },
        currency,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('Currency Service: Default currencies seeded or already present');
  } catch (error) {
    console.error('Currency Service: Error seeding default currencies:', error.message);
  }
};

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
};

const routes = (app) => {
    //Swagger Documentation
    setupSwagger(app);

    app.use(`${BASE_PATH}/Currency`, currencyRoutes);

    app.get(`${BASE_PATH}/Health`, (req, res) => {
        res.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'currency-service'
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado en Currency API'
        });
    });
};

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT;

    app.set('trust proxy', 1);

    try {
        await dbConnection();
        await seedDefaultCurrencies();
        middlewares(app);
        routes(app);

        app.listen(PORT, () => {
            console.log(`currency-service Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/Health`);
        });

    } catch (error) {
        console.error(`Error starting Server: ${error.message}`);
        process.exit(1);
    }
};