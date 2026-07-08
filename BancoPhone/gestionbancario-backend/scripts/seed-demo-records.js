'use strict';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import BankAccount from '../src/fields/bankAccount/bankAccount_model.js';
import Currency from '../src/fields/Currency/Currency_model.js';
import ExchangeRate from '../src/fields/ExchangeRate/ExchangeRate_model.js';
import FinancialProduct from '../src/fields/financialproduct/financialproduct_model.js';
import Transaction from '../src/fields/transactions/transactions_model.js';
import Record from '../src/fields/record/record_model.js';

dotenv.config();

const DEMO_USER_ID = 'demo-user-001';
const DEMO_USER_EMAIL = 'demo.user@gestionbanco.local';
const DEMO_PREFIX = 'DEMO-SEED';

const currencies = [
    { nombre: 'Quetzal', codigo: 'GTQ', simbolo: 'Q' },
    { nombre: 'Dolar estadounidense', codigo: 'USD', simbolo: '$' },
    { nombre: 'Euro', codigo: 'EUR', simbolo: '€' },
    { nombre: 'Peso mexicano', codigo: 'MXN', simbolo: '$' },
    { nombre: 'Colon costarricense', codigo: 'CRC', simbolo: '₡' },
    { nombre: 'Lempira hondureno', codigo: 'HNL', simbolo: 'L' },
    { nombre: 'Cordoba nicaraguense', codigo: 'NIO', simbolo: 'C$' },
    { nombre: 'Balboa panameno', codigo: 'PAB', simbolo: 'B/.' },
    { nombre: 'Libra esterlina', codigo: 'GBP', simbolo: '£' },
    { nombre: 'Dolar canadiense', codigo: 'CAD', simbolo: 'C$' },
];

const financialProducts = [
    ['Cuenta Ahorro Plus', 'Cuenta de ahorro con beneficios digitales', 2.5, 'ahorro'],
    ['Cuenta Nomina', 'Producto para recepcion de salario', 1.25, 'cuenta'],
    ['Deposito a Plazo 90', 'Inversion a plazo fijo de 90 dias', 4.1, 'inversion'],
    ['Deposito a Plazo 180', 'Inversion a plazo fijo de 180 dias', 4.8, 'inversion'],
    ['Tarjeta Clasica', 'Linea de credito de uso cotidiano', 3.2, 'credito'],
    ['Tarjeta Oro', 'Credito con limite preferencial', 3.8, 'credito'],
    ['Prestamo Personal', 'Financiamiento personal de libre destino', 6.5, 'prestamo'],
    ['Prestamo Vehiculo', 'Financiamiento para compra de vehiculo', 5.9, 'prestamo'],
    ['Seguro Proteccion', 'Cobertura basica para cuenta activa', 1.1, 'seguro'],
    ['Fondo Futuro', 'Ahorro programado con meta mensual', 3.6, 'ahorro'],
];

const accountNames = [
    'Cuenta Principal',
    'Ahorro Familiar',
    'Gastos Mensuales',
    'Fondo Emergencia',
    'Cuenta Nomina',
    'Ahorro Vacaciones',
    'Pagos Servicios',
    'Reserva Salud',
    'Meta Estudios',
    'Ahorro Inversion',
];

const upsertBy = async (Model, filter, data) => {
    await Model.updateOne(filter, { $setOnInsert: data }, { upsert: true, runValidators: true });
    return Model.findOne(filter);
};

const upsertAndSyncBy = async (Model, filter, data) => {
    await Model.updateOne(filter, { $set: data }, { upsert: true, runValidators: true });
    return Model.findOne(filter);
};

const seed = async () => {
    if (!process.env.URI_MONGO) {
        throw new Error('URI_MONGO no esta configurada en .env');
    }

    await mongoose.connect(process.env.URI_MONGO, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
    });

    const currencyDocs = [];
    for (const currency of currencies) {
        currencyDocs.push(await upsertBy(Currency, { codigo: currency.codigo }, currency));
    }

    const accountDocs = [];
    for (let i = 0; i < accountNames.length; i += 1) {
        const numeroCuenta = `${DEMO_PREFIX}-ACC-${String(i + 1).padStart(2, '0')}`;
        accountDocs.push(await upsertBy(BankAccount, { numeroCuenta }, {
            nombre: accountNames[i],
            numeroCuenta,
            tipoCuenta: i % 2 === 0 ? 'ahorro' : 'corriente',
            saldo: 100 + (i * 150),
            estado: 'activa',
            usuarioId: DEMO_USER_ID,
            usuarioEmail: DEMO_USER_EMAIL,
        }));
    }

    for (let i = 0; i < financialProducts.length; i += 1) {
        const [nombre, descripcion, tasaInteres, tipoProducto] = financialProducts[i];
        await upsertBy(FinancialProduct, { nombre }, {
            nombre,
            descripcion,
            tasaInteres,
            tipoProducto,
            activo: true,
        });
    }

    const gtq = currencyDocs.find((currency) => currency.codigo === 'GTQ');
    for (let i = 0; i < 10; i += 1) {
        const target = currencyDocs[(i + 1) % currencyDocs.length];
        await upsertBy(ExchangeRate, { nameDestiny: `${DEMO_PREFIX}-RATE-${String(i + 1).padStart(2, '0')}` }, {
            nameDestiny: `${DEMO_PREFIX}-RATE-${String(i + 1).padStart(2, '0')}`,
            divisaBase: gtq._id,
            divisaDestino: target._id,
            tasa: Number((0.13 + (i * 0.17)).toFixed(4)),
        });
    }

    const transactionDocs = [];
    for (let i = 0; i < 10; i += 1) {
        const origen = accountDocs[i];
        const destino = accountDocs[(i + 1) % accountDocs.length];
        const referencia = `${DEMO_PREFIX}-TX-${String(i + 1).padStart(2, '0')}`;
        transactionDocs.push(await upsertAndSyncBy(Transaction, { referencia }, {
            tipo: i % 3 === 0 ? 'deposito' : i % 3 === 1 ? 'retiro' : 'transferencia',
            monto: 25 + (i * 10),
            cuentaOrigen: origen._id,
            cuentaDestino: destino._id,
            estado: 'completado',
            usuarioId: DEMO_USER_ID,
            referencia,
            idempotencyKey: `${referencia}-KEY`,
            descripcion: `Movimiento demo ${i + 1}`,
            canal: 'web',
        }));
    }

    for (let i = 0; i < 10; i += 1) {
        await upsertBy(Record, {
            cuentaId: accountDocs[i]._id,
            listaTransacciones: transactionDocs[i]._id,
        }, {
            cuentaId: accountDocs[i]._id,
            listaTransacciones: transactionDocs[i]._id,
            fechaActualizacion: new Date(),
        });
    }

    const counts = {
        currencies: await Currency.countDocuments(),
        bankAccounts: await BankAccount.countDocuments(),
        exchangeRates: await ExchangeRate.countDocuments(),
        financialProducts: await FinancialProduct.countDocuments(),
        transactions: await Transaction.countDocuments(),
        records: await Record.countDocuments(),
    };

    console.log('Seed demo completado:', counts);
};

seed()
    .catch((error) => {
        console.error('Error ejecutando seed demo:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });
