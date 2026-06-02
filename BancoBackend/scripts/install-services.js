const { execFileSync } = require('child_process');
const path = require('path');

const services = [
  'BankAccount-service',
  'Currency-service',
  'Exchangerate-service',
  'GestionBancarioManagment',
  'Notification-service',
  'Transactions-service',
];

for (const service of services) {
  const servicePath = path.join(__dirname, '..', service);
  console.log(`Installing dependencies for ${service}`);

  try {
    execFileSync('pnpm', ['install'], {
      cwd: servicePath,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
  } catch (error) {
    console.error(`Error installing dependencies for ${service}: ${error.message}`);
    process.exitCode = 1;
  }
}
