import express from 'express';

import kikoRouter from './kiko.routes';
import authRouter from './auth.routes';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from "../../swagger/swagger.json";
import v1RoutesRoutes from './v1.routes';
import { selectedMiddleware } from '../../constants';

const v1Routers = express.Router();

/** Routes without middleware or relies on APIKEY */
v1Routers.use('/auth', authRouter);
v1Routers.use('/kikoOrderStatus', kikoRouter);
v1Routers.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/** Select middleware according to the ENV */
v1Routers.use('/', selectedMiddleware, v1RoutesRoutes);

export default v1Routers;