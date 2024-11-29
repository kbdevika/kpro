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

  kikoRouter.post('/search', async (req: any, res: any) => {
    const { pincode } = req.body;

    if (!pincode) {
      throw new Error('Pincode is not available');
    }
  
    try {
      // Fetch from the external API if not present
      const response = await fetch('https://ondc-api.kiko.live/ondc-seller-v2/kiranaProSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pincode: parseInt(pincode) }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch catalogue from API: ${response.statusText}`);
      }
  
      const data = await response.json();

      const newCatalogue = await prisma.catalogue.upsert({
        where: {
          pincode: pincode,  // Assuming 'pincode' is unique for each catalogue
        },
        update: {
          jsonData: data,  // If the catalogue exists, update its jsonData
        },
        create: {
          pincode: pincode,  // If the catalogue doesn't exist, create a new one
          jsonData: data,
        },
      });

      res.status(response.status).json(newCatalogue)
    }catch (error: any){
      res.status(400).json({
        error: error.message
      })
    }
  })
  

export default kikoRouter;