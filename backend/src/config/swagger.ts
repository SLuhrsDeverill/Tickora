import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tickora API',
      version: '1.0.0',
      description: 'API completa para el sistema de gestión de tickets Tickora',
    },
    servers: [
      {
        url: `http://localhost:${process.env['PORT'] || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.dto.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
