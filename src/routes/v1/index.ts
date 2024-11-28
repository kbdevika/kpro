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

const v1Routers = express.Router();

v1Routers.use('/order', ordersRouter);
v1Routers.use('/audio', audioRouter);
v1Routers.use('/kikoOrderStatus', kikoRouter);
v1Routers.use('/notifications', notificationRouter);
v1Routers.use('/cart', cartRouter);
v1Routers.use('/payment', paymentRouter);
v1Routers.use('/user', userProfileRouter);
v1Routers.use('/user/settings', userSettingsRouter);
v1Routers.use('/user/address', userAddressRouter);
v1Routers.use('/', taskRouter);
v1Routers.use('/home', homeRouter);

export default v1Routers;