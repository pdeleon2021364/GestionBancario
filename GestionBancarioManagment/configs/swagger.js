import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gestión Bancaria API',
      version: '1.0.0',
      description: 'API completa para el sistema de gestión bancaria con Node.js, Express, MongoDB y PostgreSQL.',
      contact: {
        name: 'GestionBancario Dev',
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese su token JWT en el formato: Bearer <token>'
        }
      }
    },
    tags: [
      { name: 'Auth',              description: 'Autenticación y verificación de usuarios' },
      { name: 'Usuarios',          description: 'Gestión de usuarios del sistema' },
      { name: 'Roles',             description: 'Gestión de roles y permisos' },
      { name: 'BankAccount',       description: 'Cuentas bancarias' },
      { name: 'Currency',          description: 'Divisas / Monedas' },
      { name: 'ExchangeRate',      description: 'Tipos de cambio y conversión de divisas' },
      { name: 'FinancialProduct',  description: 'Productos financieros' },
      { name: 'Transactions',      description: 'Transacciones bancarias' },
      { name: 'Record',            description: 'Historial de movimientos por cuenta' },
      { name: 'Favorites',         description: 'Cuentas favoritas para transferencias' },
    ]
  },
  apis: [
    './src/fields/auth/*.js',
    './src/fields/Usuarios/*.js',
    './src/fields/Roles/*.js',
    './src/fields/bankAccount/*.js',
    './src/fields/Currency/*.js',
    './src/fields/ExchangeRate/*.js',
    './src/fields/financialproduct/*.js',
    './src/fields/transactions/*.js',
    './src/fields/record/*.js',
    './src/fields/favorites/*.js',
  ]
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { font-size: 28px; font-weight: 700; color: #1a3c5e; }
      .swagger-ui .scheme-container { background: #f0f4f8; padding: 15px; border-radius: 8px; }
    `,
    customSiteTitle: 'Gestión Bancaria API - Documentación',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📘 Swagger UI disponible en → http://localhost:${process.env.PORT || 3000}/api-docs`);
};

export { swaggerSpec };
