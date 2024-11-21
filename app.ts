// src/server.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import RazorPay from 'razorpay';
import * as dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import winston from 'winston';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const wss = new WebSocketServer({ noServer: true });

// Middleware
app.use(express.json());

// JWT Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRE_MINUTES = 30;

// Razorpay Configuration
const razorpay = new RazorPay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxx',
  key_secret: process.env.RAZORPAY_SECRET || 'xxx'
});

// Add logger configuration after dotenv.config()
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Helper function for error responses
const handleError = (error: any, res: any) => {
  logger.error('Error occurred:', { error: error.message, stack: error.stack });
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
};

// Auth Middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY) as any;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper Functions
const createAccessToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    SECRET_KEY,
    { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` }
  );
};

// Routes
const v1Router = express.Router();

// Auth Routes

/**
 * @swagger
 * /auth/truecaller:
 *   post:
 *     summary: Authenticate user via Truecaller token
 *     description: Authenticate the user using a token from Truecaller and provide a JWT.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The Truecaller token to authenticate.
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: The JWT token for accessing the API.
 *                 token_type:
 *                   type: string
 *                   example: bearer
 *       500:
 *         description: Internal server error
 */
v1Router.post('/auth/truecaller', async (req, res) => {
  try {
    const { token } = req.body;
    // Validate Truecaller token (implement actual validation)
    const userId = token; // Get from Truecaller token

    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: userId }
      });
    }

    const accessToken = createAccessToken(user.id);
    res.json({ access_token: accessToken, token_type: 'bearer' });
  } catch (error) {
    handleError(error, res);
  }
});

// User Settings Routes

/**
 * @swagger
 * /v1/user/settings:
 *   get:
 *     summary: Get user settings
 *     description: Retrieve all settings for the authenticated user.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user settings.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "1"
 *                   userId:
 *                     type: string
 *                     example: "user_123"
 *                   key:
 *                     type: string
 *                     example: "theme"
 *                   value:
 *                     type: string
 *                     example: "dark"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
v1Router.get('/user/settings', authenticateToken, async (req: any, res) => {
  try {
    const settings = await prisma.userSetting.findMany({
      where: { userId: req.user.id }
    });
    res.json(settings);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /v1/user/settings:
 *   post:
 *     summary: Create a new user setting
 *     description: Add a new setting for the authenticated user.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 example: "theme"
 *               value:
 *                 type: string
 *                 example: "dark"
 *     responses:
 *       200:
 *         description: Setting created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting created successfully"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
v1Router.post('/user/settings', authenticateToken, async (req: any, res) => {
  try {
    const { key, value } = req.body;
    await prisma.userSetting.create({
      data: {
        userId: req.user.id,
        key,
        value
      }
    });
    res.json({ message: 'Setting created successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /v1/user/settings/{key}:
 *   put:
 *     summary: Update an existing user setting
 *     description: Update a setting for the authenticated user based on the key.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The key of the setting to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: "light"
 *     responses:
 *       200:
 *         description: Setting updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting updated successfully"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Setting not found.
 *       500:
 *         description: Internal server error.
 */
v1Router.put('/user/settings/:key', authenticateToken, async (req: any, res: any) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const updated = await prisma.userSetting.updateMany({
      where: {
        userId: req.user.id,
        key
      },
      data: { value }
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /v1/user/settings/{key}:
 *   delete:
 *     summary: Delete a user setting
 *     description: Delete a specific setting for the authenticated user based on the key.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The key of the setting to delete.
 *     responses:
 *       200:
 *         description: Setting deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting deleted successfully"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Setting not found.
 *       500:
 *         description: Internal server error.
 */
v1Router.delete('/user/settings/:key', authenticateToken, async (req: any, res: any) => {
  try {
    const { key } = req.params;
    
    const deleted = await prisma.userSetting.deleteMany({
      where: {
        userId: req.user.id,
        key
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

// Address Routes

/**
 * @swagger
 * /v1/user/address:
 *   get:
 *     summary: Get user addresses
 *     description: Retrieve all addresses for the authenticated user.
 *     tags:
 *       - Address
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "1"
 *                   userId:
 *                     type: string
 *                     example: "user_123"
 *                   street:
 *                     type: string
 *                     example: "123 Main St"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   postalCode:
 *                     type: string
 *                     example: "10001"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
v1Router.get('/user/address', authenticateToken, async (req: any, res: any) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id }
    });
    res.json(addresses);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /v1/user/address:
 *   post:
 *     summary: Create a new user address
 *     description: Add a new address for the authenticated user.
 *     tags:
 *       - Address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               street:
 *                 type: string
 *                 example: "123 Main St"
 *               city:
 *                 type: string
 *                 example: "New York"
 *               state:
 *                 type: string
 *                 example: "NY"
 *               country:
 *                 type: string
 *                 example: "USA"
 *               postalCode:
 *                 type: string
 *                 example: "10001"
 *     responses:
 *       200:
 *         description: Address created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Address created successfully"
 *                 id:
 *                   type: string
 *                   example: "address_123"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
v1Router.post('/user/address', authenticateToken, async (req: any, res) => {
  try {
    const { street, city, state, country, postalCode } = req.body;
    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        street,
        city,
        state,
        country,
        postalCode
      }
    });
    res.json({ message: 'Address created successfully', id: address.id });
  } catch (error) {
    handleError(error, res);
  }
});

// Cart Routes
/**
 * @swagger
 * /v1/cart:
 *   post:
 *     summary: Create a new cart for the user
 *     description: Creates a new cart associated with the authenticated user.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart_id:
 *                   type: string
 *                   example: "cart_123"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
v1Router.post('/cart', authenticateToken, async (req: any, res) => {
  try {
    const cart = await prisma.cart.create({
      data: {
        userId: req.user.id
      }
    });
    res.json({ cart_id: cart.id });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /v1/cart/{id}:
 *   get:
 *     summary: Get cart details
 *     description: Retrieve cart details, including items, subtotal, shipping, and total for the authenticated user.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cart to retrieve.
 *     responses:
 *       200:
 *         description: Cart details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "cart_123"
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "item_123"
 *                       name:
 *                         type: string
 *                         example: "Sample Item"
 *                       price:
 *                         type: number
 *                         example: 20.0
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                 subTotal:
 *                   type: number
 *                   example: 40.0
 *                 shipping:
 *                   type: number
 *                   example: 10.0
 *                 total:
 *                   type: number
 *                   example: 50.0
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Cart not found.
 *       500:
 *         description: Internal server error.
 */
v1Router.get('/cart/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        items: true
      }
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const subTotal = cart.items.reduce((sum: any, item: any) => 
      sum + (item.price * item.quantity), 0);
    const shipping = 10.0;
    const total = subTotal + shipping;

    res.json({
      id: cart.id,
      items: cart.items,
      subTotal,
      shipping,
      total
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Order Routes
/**
 * @swagger
 * /v1/cart/{id}:
 *   post:
 *     summary: Create an order from a cart
 *     description: Converts a cart to an order with a 'created' status for the authenticated user.
 *     tags:
 *       - Order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cart to convert to an order.
 *     responses:
 *       200:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_id:
 *                   type: string
 *                   example: "order_123"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Cart not found.
 *       500:
 *         description: Internal server error.
 */
v1Router.post('/cart/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: {
        id: req.params.id,
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

    res.json({ order_id: order.id });
  } catch (error) {
    handleError(error, res);
  }
});

// Payment Routes

/**
 * @swagger
 * /v1/payment:
 *   post:
 *     summary: Initiate a payment
 *     description: Creates a payment order with Razorpay for the specified amount.
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *                 example: "order_123"
 *     responses:
 *       200:
 *         description: Payment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "pay_123"
 *                 amount:
 *                   type: number
 *                   example: 50000
 *                 currency:
 *                   type: string
 *                   example: "INR"
 *                 payment_capture:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
v1Router.post('/payment', authenticateToken, async (req: any, res: any) => {
  try {
    const { order_id } = req.body;
    const payment = await razorpay.orders.create({
      amount: 50000,
      currency: 'INR',
      payment_capture: true
    });
    res.json(payment);
  } catch (error) {
    handleError(error, res);
  }
});

// Task Routes
/**
 * @swagger
 * /v1/agent:
 *   post:
 *     summary: Create a new task
 *     description: Initiates a task in 'processing' status for the authenticated user.
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task_id:
 *                   type: string
 *                   example: "task_123"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
v1Router.post('/agent', authenticateToken, async (req: any, res) => {
  try {
    const task = await prisma.task.create({
      data: {
        status: 'processing',
        userId: req.user.id,
        summary: ''
      }
    });
    res.json({ task_id: task.id });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /v1/task/{taskId}:
 *   get:
 *     summary: Get task status and details
 *     description: Retrieves the status and details of a task for the authenticated user.
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to retrieve.
 *     responses:
 *       200:
 *         description: Task status and details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 output:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       example: "Task summary"
 *                     lineItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "lineItem_123"
 *                           description:
 *                             type: string
 *                             example: "Sample line item"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */
v1Router.get('/task/:taskId', authenticateToken, async (req: any, res: any) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.taskId,
        userId: req.user.id
      },
      include: {
        lineItems: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status === 'success') {
      res.json({
        status: 'success',
        output: {
          summary: task.summary,
          lineItems: task.lineItems
        }
      });
    } else {
      res.json({ status: task.status });
    }
  } catch (error) {
    handleError(error, res);
  }
});

// WebSocket handling
const handleWebSocket = (socket: WebSocket, req: any) => {
  const token = req.url.split('?token=')[1];

  try {
    const payload = jwt.verify(token, SECRET_KEY) as any;
    if (!payload.sub) {
      socket.close(1008);
      return;
    }

    socket.on('message', (data) => {
      socket.send(`Message received: ${data}`);
    });

    socket.on('close', () => {
      console.log(`WebSocket disconnected for user ${payload.sub}`);
    });
  } catch (error) {
    socket.close(1008);
  }
};

// Apply routes
app.use('/v1', v1Router);
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Start server
const server = app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', handleWebSocket);

export default server;