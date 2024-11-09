// src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for your server'
    },
    servers: [
      {
        url: 'http://localhost:8000/v1',
        description: 'Local server'
      }
    ],
  },
  apis: ['./app.ts'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
