import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

// Define base URLs for different environments
const BASE_URLS = {
  localhost: 'http://localhost:8000',
  development: 'https://dev-api.kpro42.com',
  production: 'https://api.kpro42.com',
} as const; // Use 'as const' to create a readonly object with literal types

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
      description: 'V1.0.0 release package swagger',
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
          bearerFormat: 'JWT', // Optional: Inform Swagger that this token uses JWT format
        },
      },
    },
    security: [
      {
        bearerAuth: [], // Applies this security scheme globally if needed
      },
    ],
  },
  apis: ['./definition.swagger.ts', './dist/definition.swagger.js', './app.ts', './dist/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
