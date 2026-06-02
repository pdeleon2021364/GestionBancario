const { spawn, spawnSync } = require('child_process');
const path = require('path');

const services = [
  'BankAccount-service',
  'Currency-service',
  'Exchangerate-service',
  'GestionBancarioManagment',
  'Notification-service',
  'Transactions-service',
];

const processes = [];
const postgresPath = path.join(__dirname, '..', '..', 'authentication-service', 'auth-service');

console.log('Starting auth-service PostgreSQL');
const postgres = spawnSync('docker', ['compose', 'up', '-d', 'postgres'], {
  cwd: postgresPath,
  stdio: 'inherit',
  shell: false,
});

if (postgres.status !== 0) {
  console.error('Backend PostgreSQL could not be started. Check Docker and try again.');
  process.exit(postgres.status || 1);
}

console.log('Checking gestionbanco database in auth-service container');
const dbExists = spawnSync('docker', [
  'exec',
  'auth-service-in6bm',
  'psql',
  '-U',
  'root',
  '-d',
  'postgres',
  '-Atc',
  "SELECT 1 FROM pg_database WHERE datname='gestionbanco';",
], {
  cwd: postgresPath,
  stdio: ['ignore', 'pipe', 'inherit'],
  shell: false,
});

if (dbExists.status !== 0) {
  console.error('Could not verify gestionbanco database.');
  process.exit(dbExists.status || 1);
}

if (dbExists.stdout.toString().trim() !== '1') {
  console.log('Database gestionbanco not found, creating it...');
  const createDb = spawnSync('docker', [
    'exec',
    'auth-service-in6bm',
    'psql',
    '-U',
    'root',
    '-d',
    'postgres',
    '-c',
    'CREATE DATABASE gestionbanco;',
  ], {
    cwd: postgresPath,
    stdio: 'inherit',
    shell: false,
  });

  if (createDb.status !== 0) {
    console.error('Could not create gestionbanco database.');
    process.exit(createDb.status || 1);
  }
}

for (const service of services) {
  console.log(`Starting ${service}`);

  const child = spawn('pnpm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', service),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  processes.push(child);
}

function stopServices() {
  console.log('Stopping all backend services...');
  processes.forEach((proc) => proc.kill());
  process.exit(0);
}

process.on('SIGINT', stopServices);
process.on('SIGTERM', stopServices);
