'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { dbConnection } from './db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { setupSwagger } from './swagger.js';
import ExchangeRate from '../src/exchangeRate_model.js';
import currencyServiceClient from '../helpers/currencyServiceClient.js';

import exchangeRateRoutes from '../src/exchangeRate_routes.js';

const BASE_PATH = '/exchangerate/v1';

const defaultExchangeRatePairs = [
  { from: 'USD', to: 'GTQ', tasa: 7.8 },
  { from: 'USD', to: 'EUR', tasa: 0.92 },
  { from: 'USD', to: 'GBP', tasa: 0.80 },
  { from: 'USD', to: 'JPY', tasa: 145.2 },
  { from: 'USD', to: 'MXN', tasa: 17.0 },
  { from: 'USD', to: 'PEN', tasa: 3.8 },
  { from: 'USD', to: 'BRL', tasa: 5.3 },
  { from: 'USD', to: 'COP', tasa: 398.0 },
  { from: 'USD', to: 'CAD', tasa: 1.36 },
  { from: 'USD', to: 'AUD', tasa: 1.50 },
  { from: 'USD', to: 'CNY', tasa: 7.3 },
  { from: 'EUR', to: 'GBP', tasa: 0.87 },
  { from: 'EUR', to: 'JPY', tasa: 158.3 },
  { from: 'GBP', to: 'AUD', tasa: 1.80 },
  { from: 'AUD', to: 'NZD', tasa: 1.12 },
  { from: 'CAD', to: 'USD', tasa: 0.74 },
  { from: 'EUR', to: 'GTQ', tasa: 8.5 },
  { from: 'GBP', to: 'JPY', tasa: 197.4 },
  { from: 'USD', to: 'CHF', tasa: 0.91 },
  { from: 'USD', to: 'SGD', tasa: 1.35 },
];

const seedDefaultExchangeRates = async () => {
  try {
    const totalRates = await ExchangeRate.countDocuments();
    if (totalRates > 0) {
      console.log('ExchangeRate Service: Existing exchange rates detected');
      return;
    }

    const records = [];
    for (const { from, to, tasa } of defaultExchangeRatePairs) {
      const origin = await currencyServiceClient.getCurrencyByCode(from);
      const destination = await currencyServiceClient.getCurrencyByCode(to);

      if (!origin?.success?.data || !destination?.success?.data) {
        console.warn(`ExchangeRate Service: Currency ${from} or ${to} not available yet`);
        continue;
      }

      const originId = origin.data._id;
      const destinationId = destination.data._id;

      const exists = await ExchangeRate.findOne({ monedaOrigen: originId, monedaDestino: destinationId });
      if (!exists) {
        records.push({ monedaOrigen: originId, monedaDestino: destinationId, tasa });
      }

      const reverseExists = await ExchangeRate.findOne({ monedaOrigen: destinationId, monedaDestino: originId });
      if (!reverseExists) {
        records.push({ monedaOrigen: destinationId, monedaDestino: originId, tasa: Number((1 / tasa).toFixed(8)) });
      }
    }

    if (records.length > 0) {
      await ExchangeRate.insertMany(records);
      console.log('ExchangeRate Service: Default exchange rates seeded');
    }
  } catch (error) {
    console.error('ExchangeRate Service: Error seeding default exchange rates:', error.message);
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
        await seedDefaultExchangeRates();
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
