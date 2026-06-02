import 'dotenv/config';
import { initServer } from './configs/app.js';

process.on('uncaughtException', (err)=> {
    console.error('Uncought Exception in BankAccount Server:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', err);
    process.exit(1);
});

console.log('Starting bankaccount-service Server...');
initServer();