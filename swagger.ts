import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

// Define base URLs for different environments
const BASE_URLS = {
  localhost: 'http://localhost:8000',
  development: 'https://dev-api.kpro42.com',
  production: 'https://api.kpro42.com',
} as const;

// Define ENV as a key of BASE_URLS
const ENV: keyof typeof BASE_URLS = (process.env.NODE_ENV as keyof typeof BASE_URLS) || 'development';

// Get the base URL for the current environment
const BASE_URL = BASE_URLS[ENV];

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Release V1.1.0',
    },
    servers: [
      {
        url: `${BASE_URL}/v1`,
        description: `${ENV.toUpperCase()} Server`,
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/**/*.ts', './dist/src/**/*.js', './app.ts', './dist/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
