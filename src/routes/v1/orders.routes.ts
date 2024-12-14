import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';
import orderToKikoOrder from '../../helper/orderToKikoOrder';
import * as dotenv from 'dotenv';

dotenv.config();

const ordersRouter = express.Router();

const kikoUrl = "https://ondc.kiko.live/ondc-seller"

/**
 * @swagger
 * /order:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     description: Retrieve all orders placed by the authenticated user, including associated cart and cart items details.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: [] # Use Bearer token for authentication
 *     responses:
 *       200:
 *         description: A list of orders with their cart details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Order ID
 *                         example: "order_12345"
 *                       status:
 *                         type: string
 *                         description: Order status
 *                         example: "completed"
 *                       cart:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Cart ID
 *                             example: "cart_67890"
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   description: Cart item ID
 *                                   example: 1
 *                                 name:
 *                                   type: string
 *                                   description: Name of the item
 *                                   example: "Laptop"
 *                                 description:
 *                                   type: string
 *                                   description: Description of the item
 *                                   example: "A high-end gaming laptop"
 *                                 quantity:
 *                                   type: integer
 *                                   description: Quantity of the item
 *                                   example: 2
 *                                 units:
 *                                   type: string
 *                                   description: Units of the item
 *                                   example: "pieces"
 *                                 price:
 *                                   type: number
 *                                   format: float
 *                                   description: Price of the item
 *                                   example: 1500.50
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: No orders found for this user
 *       500:
 *         description: Internal server error
 */
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
          address: true
        },
      });
  
      res.json({ orders });
    } catch (error) {
      handleError(error, res);
    }
  });

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Create an order from a cart
 *     description: This endpoint creates an order based on the cart ID and address ID provided in the request body, then forwards the order to an external API for processing.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartId:
 *                 type: string
 *                 description: The ID of the cart to create the order from.
 *               addressId:
 *                 type: string
 *                 description: The ID of the address to associate with the order.
 *             required:
 *               - cartId
 *               - addressId
 *     responses:
 *       200:
 *         description: Order successfully created and forwarded to external API.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: string
 *                   example: order_12345
 *                 status:
 *                   type: string
 *                   example: created
 *                 externalApiResponse:
 *                   type: object
 *                   description: The response from the external API after forwarding the order.
 *       400:
 *         description: Bad Request - Missing required fields or invalid data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing cartId or addressId
 *       404:
 *         description: Not Found - Cart not found for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Cart not found
 *       500:
 *         description: Internal Server Error - An unexpected error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred
 */
ordersRouter.post('/', async (req: any, res: any) => {
    const { cartId, addressId } = req.body;

    if (!cartId || !addressId) {
      return res.status(404).json({ error: 'CartId and AddressId is required' });
    }

    try {
      const modifiedOrder = await orderToKikoOrder(cartId.toString(), req.user.id, parseInt(addressId))

      // Fetch request to the external API
      // const response = await fetch(`${kikoUrl}/kiranapro-create-order`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(modifiedOrder),
      // });
  
      // // Parse the response
      const data = 'Order to Kiko is disabled' // await response.json();
  
      // Forward the external API response back to the client
      return res.status(200).json({data, modifiedOrder});
    } catch (error) {
      handleError(error, res);
    }
  })
  
/**
 * @swagger
 * /order/{id}:
 *   get:
 *     summary: Get details of a specific order
 *     description: Fetches the details of an order by its ID. Returns order details such as the status, delivery status, and associated cart items.
 *     operationId: getOrderById
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order to fetch details for.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully fetched order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: object
 *                   description: The details of the order.
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The ID of the order.
 *                       example: "12345"
 *                     status:
 *                       type: string
 *                       description: The current status of the order.
 *                       example: "in-progress"
 *                     deliveryStatus:
 *                       type: string
 *                       description: The current delivery status of the order.
 *                       example: "out-for-delivery"
 *                     cart:
 *                       type: object
 *                       description: Cart details associated with the order.
 *                       properties:
 *                         userId:
 *                           type: string
 *                           description: The user ID who owns the cart.
 *                           example: "user123"
 *       '403':
 *         description: Unauthorized user trying to access an order they do not own
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized user"
 *       '404':
 *         description: No orders found for the specified ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No orders found for this user"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     security:
 *       - bearerAuth: []  # Assuming you're using a bearer token for authentication
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
  ordersRouter.get('/:id', async (req: any, res: any) => {
    try {
      const orders = await prisma.order.findFirst({
        where: {
          id: req.params.id
        },
        include: {
          cart: true,
          address: true
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
  

  /**
 * @swagger
 * /order/{id}/track:
 *   get:
 *     summary: Track the status of an order
 *     description: Fetches the current status and delivery status of an order.
 *     operationId: trackOrder
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order to track.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully fetched the order status and delivery status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderStatus:
 *                   type: string
 *                   description: The current status of the order.
 *                   example: "in-progress"
 *                 deliveryStatus:
 *                   type: string
 *                   description: The current delivery status of the order.
 *                   example: "out-for-delivery"
 *       '403':
 *         description: Unauthorized user trying to track an order they do not own
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized user"
 *       '404':
 *         description: Order not found for the specified ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No orders found for this user"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     security:
 *       - bearerAuth: []  # Assuming you're using a bearer token for authentication
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
  ordersRouter.get('/:id/track', async (req: any, res: any) => {
    try {
      const orders = await prisma.order.findUnique({
        where: {
          id: req.params.id
        },
        include: {
          cart: true
        }
      });
  
      if (orders && orders.cart.userId === req.userId) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
  
      if (!orders) {
        return res.status(404).json({ error: 'No orders found for this user' });
      }
  
      res.json({ orderStatus: orders.status, deliveryStatus: orders.deliveryStatus });
    } catch (error) {
      handleError(error, res);
    }
  });
  

  /**
 * @swagger
 * /order/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     description: Cancels an order if it meets certain conditions.
 *     operationId: cancelOrder
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order to be canceled.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Request body to cancel the order (not needed in this case).
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       '200':
 *         description: Order successfully canceled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order has been successfully cancelled."
 *       '400':
 *         description: |
 *           Bad request due to one of the following reasons:
 *           - Order not found
 *           - Order already delivered
 *           - Order already cancelled
 *           - Order has been picked-up and no more cancellations possible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order has been picked-up. No more cancellation possible."
 *       '403':
 *         description: User not authorized to cancel the order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You are not authorized to cancel this order."
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     security:
 *       - bearerAuth: []
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
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