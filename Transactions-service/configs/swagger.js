import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Transactions Service API',
      version: '1.0.0',
      description: 'Servicio de gestión de transacciones para el sistema bancario.',
      contact: {
        name: 'GestionBancario Dev',
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3004}`,
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
      { name: 'Transactions', description: 'Gestión de transacciones bancarias' },
    ]
  },
  apis: ['./src/transactions_routes.js']
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
    customSiteTitle: 'Transactions API - Documentación',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📘 Swagger UI disponible en → http://localhost:${process.env.PORT || 3004}/api-docs`);
};
