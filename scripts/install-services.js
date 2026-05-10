const { execSync } = require('child_process');

const services = [
    'authentication-service/auth-node',
    'BankAccount-service',
    'Currency-service',
    'Exchangerate-service',
    'GestionBancarioManagment',
    'Notification-service',
    'Transactions-service'
];

services.forEach(service => {
    console.log(`Installing dependencies for ${service}`);
    try {
        execSync(`cd ${service} && pnpm install`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error installing dependencies for ${service}:`, error.message);
    }
});