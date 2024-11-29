import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';

const kikoRouter = express.Router();

/**
 * No swagger
 */
kikoRouter.post('/', async (req: any, res: any) => {
    const { orderId, orderStatus, deliveryStatus } = req.body;
  
    const orderStatusRef = ['in-progress', 'completed', 'cancelled'];
    const deliveryStatusRef = [
      'accepted',
      'agent-assigned',
      'order-picked-up',
      'out-for-delivery',
      'order-delivered',
      'rto-initiated',
      'rto-delivered',
      'cancelled',
    ];
  
    try {
      // Validate all required fields
      if (!orderId || !orderStatus || !deliveryStatus) {
        return res.status(400).json({ error: 'Order ID, orderStatus, and deliveryStatus are required' });
      }
  
      // Normalize to lowercase for validation
      const normalizedOrderStatus = orderStatus.toLowerCase();
      const normalizedDeliveryStatus = deliveryStatus.toLowerCase();
  
      // Validate orderStatus
      if (!orderStatusRef.includes(normalizedOrderStatus)) {
        return res.status(400).json({
          error: `Invalid order status`,
        });
      }
  
      // Validate deliveryStatus
      if (!deliveryStatusRef.includes(normalizedDeliveryStatus)) {
        return res.status(400).json({
          error: `Invalid delivery status`,
        });
      }
  
  
      // Update the order with the new statuses
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: normalizedOrderStatus,      
          deliveryStatus: normalizedDeliveryStatus,
        },
      });
  
      return res.status(200).json({ 
        message: 'Order updated successfully', 
        orderId: orderId,
        orderStatus: orderStatus,
        deliveryStatus: deliveryStatus
      });
    } catch (error) {
      handleError(error, res);
    }
  })
  

export default kikoRouter;