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

const v1Routers = express.Router();

v1Routers.use('/auth', authRouter);
v1Routers.use('/order', middleware.decodeFirebaseToken, ordersRouter);
v1Routers.use('/audio', middleware.decodeFirebaseToken, audioRouter);
v1Routers.use('/kikoOrderStatus', middleware.decodeFirebaseToken, kikoRouter);
v1Routers.use('/notifications', middleware.decodeFirebaseToken, notificationRouter);
v1Routers.use('/cart', middleware.decodeFirebaseToken, cartRouter);
v1Routers.use('/payment', middleware.decodeFirebaseToken, paymentRouter);
v1Routers.use('/user', middleware.decodeFirebaseToken, userProfileRouter);
v1Routers.use('/user/settings', middleware.decodeFirebaseToken, userSettingsRouter);
v1Routers.use('/user/address', middleware.decodeFirebaseToken, userAddressRouter);
v1Routers.use('/task', middleware.decodeFirebaseToken, taskRouter);
v1Routers.use('/home', middleware.decodeFirebaseToken, homeRouter);

export default v1Routers;