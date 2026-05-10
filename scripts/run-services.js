const { spawn } = require('child_process');

const services = [
    'BankAccount-service',
    'Currency-service',
    'Exchangerate-service',
    'GestionBancarioManagment',
    'Notification-service',
    'Transactions-service'
];

const processes = [];

services.forEach(service => {
    console.log(`Starting ${service}`);
    const child = spawn('pnpm', ['dev'], {
        cwd: service,
        stdio: 'inherit',
        shell: true
    });
    processes.push(child);
});

// Manejar señales para terminar procesos
process.on('SIGINT', () => {
    console.log('Stopping all services...');
    processes.forEach(proc => proc.kill());
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Stopping all services...');
    processes.forEach(proc => proc.kill());
    process.exit(0);
});