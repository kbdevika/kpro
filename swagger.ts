// src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

// import the BASE_URL from the process.env object or .env file
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

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
        url: BASE_URL + '/v1',
        description: 'Server'
      }
    ],
  },
  apis: ['./app.ts', './dist/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
