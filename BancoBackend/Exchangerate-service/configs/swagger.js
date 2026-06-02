import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ExchangeRate Service API',
            version: '1.0.0',
            description: 'Servicio de tipos de cambio y conversion de divisas.',
            contact: {
                name: 'GestionBancario Dev'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3005}`,
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
        tags: [{ name: 'ExchangeRate', description: 'Gestion de tipos de cambio' }]
    },
    apis: ['./src/exchangeRate_routes.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'ExchangeRate API - Documentacion',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true
        }
    }));

    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`Swagger UI disponible en -> http://localhost:${process.env.PORT || 3005}/api-docs`);
};
