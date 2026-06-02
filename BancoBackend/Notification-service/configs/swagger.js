import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notification Service API',
            version: '1.0.0',
            description: 'Servicio de notificaciones por correo para eventos y reportes PDF.',
            contact: { name: 'GestionBancario Dev' }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3010}`,
                description: 'Servidor de desarrollo local'
            }
        ],
        tags: [{ name: 'Notification', description: 'Envio de correos de notificacion' }]
    },
    apis: ['./src/notification_routes.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'Notification API - Documentacion'
    }));

    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};
