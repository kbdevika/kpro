import express from 'express';
import ordersRouter from './orders.routes';
import audioRouter from './audio.routes';
import kikoRouter from './kiko.routes';
import notificationRouter from './notifications.routes';
import cartRouter from './cart.routes';
import paymentRouter from './payment.routes';
import userSettingsRouter from './userSettings.routes';
import userProfileRouter from './userProfile.routes';
import userAddressRouter from './userAddress.routes';
import taskRouter from './tasks.routes';
import homeRouter from './home.routes';
import middleware from '../../middleware';
import authRouter from './auth.routes';
import aiRouter from '../microservices/ai';

const v1Routers = express.Router();

/* Select the appropriate middleware based on the environment */
const selectedMiddleware = process.env.NODE_ENV === 'production' 
  ? middleware.decodeFirebaseToken 
  : middleware.authenticateJWTToken;

/** Routes without middleware or relies on APIKEY */
v1Routers.use('/auth', authRouter);
v1Routers.use('/kikoOrderStatus', kikoRouter);

/** Routes with middleware */
const middlewareRoutes = [
    { path: '/ai', router: aiRouter },
    { path: '/order', router: ordersRouter },
    { path: '/audio', router: audioRouter },
    { path: '/notifications', router: notificationRouter },
    { path: '/cart', router: cartRouter },
    { path: '/payment', router: paymentRouter },
    { path: '/user', router: userProfileRouter },
    { path: '/user/settings', router: userSettingsRouter },
    { path: '/user/address', router: userAddressRouter },
    { path: '/task', router: taskRouter },
    { path: '/home', router: homeRouter },
  ];
  
middlewareRoutes.forEach(route => {
    v1Routers.use(route.path, selectedMiddleware, route.router);
});

export default v1Routers;