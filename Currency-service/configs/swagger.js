import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Currency Service API',
      version: '1.0.0',
      description: 'Servicio de gestión de divisas y monedas para el sistema bancario.',
      contact: {
        name: 'GestionBancario Dev',
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3003}`,
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
      { name: 'Currency', description: 'Gestión de divisas y monedas' },
    ]
  },
  apis: ['./src/Currency_routes.js']
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
    customSiteTitle: 'Currency API - Documentación',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📘 Swagger UI disponible en → http://localhost:${process.env.PORT || 3003}/api-docs`);
};
