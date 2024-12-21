import express from 'express';

import kikoRouter from './kiko.routes';
import middleware from '../../middleware';
import authRouter from './auth.routes';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from "../../swagger/swagger.json";
import v1RoutesRoutes from './v1Routes.routes';

const v1Routers = express.Router();

/* Select the appropriate middleware based on the environment */
const selectedMiddleware = process.env.NODE_ENV === 'production' 
  ? middleware.decodeFirebaseToken 
  : middleware.authenticateJWTToken;

/** Routes without middleware or relies on APIKEY */
v1Routers.use('/auth', authRouter);
v1Routers.use('/kikoOrderStatus', kikoRouter);
v1Routers.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/** Select middleware according to the ENV */
v1Routers.use('/', selectedMiddleware, v1RoutesRoutes);

export default v1Routers;