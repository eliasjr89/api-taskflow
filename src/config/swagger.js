// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description:
        'API profesional para la gestión de tareas, usuarios y proyectos.',
      contact: {
        name: 'Support',
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: 'http://localhost:3000/taskflow',
        description: 'Servidor de Desarrollo',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Scan routes for JSDoc
};

export const swaggerSpec = swaggerJSDoc(options);
