import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';
import orderToKikoOrder from '../../helper/orderToKikoOrder';
import * as dotenv from 'dotenv';

dotenv.config();

const ordersRouter = express.Router();

const kikoUrl = "https://ondc-api.kiko.live/ondc-seller-v2"

// Fetch Orders of a User
ordersRouter.get('/', async (req: any, res: any) => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          cart: {
            userId: req.user.id,
          },
        },
        include: {
          cart: {
            include: {
              items: true,
            },
          },
        },
      });
  
      res.json({ orders });
    } catch (error) {
      handleError(error, res);
    }
  });

/**
 * Swagger Required
 */
ordersRouter.post('/', async (req: any, res: any) => {
    const { cartId, addressId } = req.body;

    const cart = await prisma.cart.findFirst({
      where: {
        id: cartId,
        userId: req.user.id
      }
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const order = await prisma.order.create({
      data: {
        cartId: cart.id,
        status: 'created'
      }
    });
  
    try {

      const modifiedOrder = await orderToKikoOrder(order.id, req.user.id, parseInt(addressId))

      // Fetch request to the external API
      const response = await fetch(`${kikoUrl}/kiranapro-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modifiedOrder),
      });
  
      // Parse the response
      const data = await response.json();
  
      // Forward the external API response back to the client
      return res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  })
  
  // Fetch single order of a User 
  ordersRouter.get('/:id', async (req: any, res: any) => {
    try {
      const orders = await prisma.order.findFirst({
        where: {
          id: req.params.id
        },
        include: {
          cart: true
        }
      });
  
      if (orders && orders.cart.userId === req.userId) {
        return res.status(403).json({ error: 'Unauthorized user' });
      }
  
      if (!orders) {
        return res.status(404).json({ error: 'No orders found for this user' });
      }
  
      res.json({ orders });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  ordersRouter.get('/:id/track', async (req: any, res: any) => {
    try {
      const orders = await prisma.order.findFirst({
        where: {
          id: req.params.id
        },
        include: {
          cart: true
        }
      });
  
      if (orders && orders.cart.userId === req.userId) {
        return res.status(403).json({ error: 'Unauthorized user' });
      }
  
      if (!orders) {
        return res.status(404).json({ error: 'No orders found for this user' });
      }
  
      res.json({ orderStatus: orders.status, deliveryStatus: orders.deliveryStatus });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  ordersRouter.post('/:id/cancel', async (req: any, res: any) => {
  
    const orderStatusRef = ['in-progress', 'cancelled'];
    const deliveryStatusRef = [
      'order-picked-up',
      'out-for-delivery',
      'order-delivered',
      'rto-initiated',
      'rto-delivered',
    ];
  
    try {
      const orders = await prisma.order.findFirst({
        where: {
          id: req.params.id
        },
        include: {
          cart: true
        }
      });
  
      // Check if the order exists
      if(orders){
        // Check if the user owns the order
        if (orders.cart.userId !== req.user.id) {
          return res.status(403).json({ error: 'You are not authorized to cancel this order' });
        }
  
        // Check if the order is already marked completed
        if(orders.status === 'completed'){
          return res.status(400).json({ 
            error: 'Order is delivered'
          })
        }
  
        // Check if the order is already marked cancelled
        if(orders.deliveryStatus === 'cancelled'){
          return res.status(400).json({ 
            error: 'Order has been cancelled'
          })
        }
    
        // Check if the order is already left the warehouse
        if(deliveryStatusRef.includes(orders.deliveryStatus) && orderStatusRef.includes(orders.status)){
          return res.status(400).json({ 
            error: 'Order has been picked-up. No more cancellation possible'
          })
        }
      } else {
        return res.status(400).json({
          error: 'Order not found'
        })
      }
  
      // Fetch request to the external API
      const response = await fetch(`${kikoUrl}/kiranapro-cancel-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kiranaProOrderId: req.params.id }),
      });
  
      // Parse the response
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to cancel the order' });
      }
  
      // Return the response from the external API
      return res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  })

export default ordersRouter;