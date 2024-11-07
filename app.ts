// src/server.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import RazorPay from 'razorpay';
import * as dotenv from 'dotenv';

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Settings Routes
v1Router.get('/user/settings', authenticateToken, async (req: any, res) => {
  try {
    const settings = await prisma.userSetting.findMany({
      where: { userId: req.user.id }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Address Routes
v1Router.get('/user/address', authenticateToken, async (req: any, res: any) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id }
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cart Routes
v1Router.post('/cart', authenticateToken, async (req: any, res) => {
  try {
    const cart = await prisma.cart.create({
      data: {
        userId: req.user.id
      }
    });
    res.json({ cart_id: cart.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Order Routes
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment Routes
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Task Routes
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    res.status(500).json({ error: 'Internal server error' });
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