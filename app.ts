// src/server.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import RazorPay from 'razorpay';
import * as dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import winston from 'winston';
import _sodium from 'libsodium-wrappers';
import crypto from 'crypto';
import multer from 'multer';
import middleware from './src/middleware';
import convertToCart from './src/helper/convertToCart';
import prisma from './src/prisma.config';

dotenv.config();

const app = express();
const wss = new WebSocketServer({ noServer: true });

// Middleware
app.use(express.json());

// JWT Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRE_MINUTES = 525600;

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

// ONDC Configuration
const ONDC_ENCRYPTION_PRIVATE_KEY = process.env.ENCRYPTION_PRIVATE_KEY || 'encryption-pvt-key'
const ONDC_PUBLIC_KEY = process.env.ONDC_PUBLIC_KEY || 'ondc-public-key'
const REQUEST_ID = process.env.REQUEST_ID || 'ondc-request-id'
const ONDC_SIGNING_PRIVATE_KEY = process.env.SIGNING_PRIVATE_KEY || 'signing-pvt-key'

// ONDC Site Verification
const htmlFile = `
<!--Contents of ondc-site-verification.html. -->
<!--Please replace SIGNED_UNIQUE_REQ_ID with an actual value-->
<html>
  <head>
    <meta
      name="ondc-site-verification"
      content="SIGNED_UNIQUE_REQ_ID"
    />
  </head>
  <body>
    ONDC Site Verification Page
  </body>
</html>
`;

const privateKey = crypto.createPrivateKey({
  key: Buffer.from(ONDC_ENCRYPTION_PRIVATE_KEY, 'base64'), // Decode private key from base64
  format: 'der', // Specify the key format as DER
  type: 'pkcs8', // Specify the key type as PKCS#8
});

const publicKey = crypto.createPublicKey({
  key: Buffer.from(ONDC_PUBLIC_KEY, 'base64'), // Decode public key from base64
  format: 'der', // Specify the key format as DER
  type: 'spki', // Specify the key type as SubjectPublicKeyInfo (SPKI)
});

const sharedKey = crypto.diffieHellman({
  privateKey: privateKey,
  publicKey: publicKey,
});

// Decrypt using AES-256-ECB
function decryptAES256ECB(key: any, encrypted: any) {
    const iv = Buffer.alloc(0); // ECB doesn't use IV
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function signMessage(signingString: any, privateKey: any) {
  await _sodium.ready;
  const sodium = _sodium;
  const signedMessage = sodium.crypto_sign_detached(
    signingString,
    sodium.from_base64(privateKey, _sodium.base64_variants.ORIGINAL)
  );
  const signature = sodium.to_base64(
    signedMessage,
    _sodium.base64_variants.ORIGINAL
  );
  return signature;
}

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
const ondcRouter = express.Router();

/**
 * Authentication Routes for 
 *      Auth Tokens, 
 *      Refresh Tokens,
 *      Logout
 */

// Auth Token Route
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

// Auth Verify token
v1Router.get('/auth/verify-token', async (req, res) => {
  try {
    res.json({ 
      verified: true, 
      auth: req.headers.authorization 
    });
  } catch (error) {
    handleError(error, res);
  }
});

// User Settings Routes
v1Router.get('/user/settings', async (req: any, res) => {
  try {
    const settings = await prisma.userSetting.findMany({
      where: { userId: req.user.id }
    });
    res.json(settings);
  } catch (error) {
    handleError(error, res);
  }
});

// Create User Settings
v1Router.post('/user/settings', async (req: any, res) => {
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

// Update User Settings
v1Router.put('/user/settings/:key', async (req: any, res: any) => {
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

// Delete User Settings
v1Router.delete('/user/settings/:key', async (req: any, res: any) => {
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

/**
 * Profile Routes
 */

// Create User Profile
v1Router.post('/user', async (req: any, res: any) => {
  try {
    const { name, email, phone } = req.body;

    // Check if the user already has a profile
    const existingProfile = await prisma.userSetting.findMany({
      where: {
        userId: req.user.id,
        key: { in: ['name', 'email', 'phone'] }, // Check for any of the profile keys
      },
    });

    if (existingProfile.length > 0) {
      return res.status(400).json({ error: 'User profile already exists' });
    }

    // If no profile exists, create the new profile
    const data = [
      { key: 'name', value: name },
      { key: 'email', value: email },
      { key: 'phone', value: phone },
    ];

    for (const item of data) {
      await prisma.userSetting.create({
        data: {
          userId: req.user.id,
          key: item.key,
          value: item.value,
        },
      });
    }

    res.status(201).json({ message: 'Settings created successfully' });
  } catch (error) {
    handleError(error, res);
  }
});


// Update User Profile
v1Router.put('/user', async (req: any, res: any) => {
  try {
    const { name, email, phone } = req.body;

    const data = [
      { key: "name", value: name },
      { key: "email", value: email },
      { key: "phone", value: phone },
    ];

    // Use a loop for await Prisma calls
    for (const item of data) {
      await prisma.userSetting.updateMany({
        where: {
          userId: req.user.id,
          key: item.key,
        },
        data: {
          value: item.value,
        },
      });
    }

    res.status(201).json({ message: 'Settings updated successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

// Fetch user profile
v1Router.get('/user', async (req: any, res) => {
  try {
    const settings = await prisma.userSetting.findMany({
      where: { userId: req.user.id }
    });

    // Transform settings array into a key-value object
    const userProfile = settings.reduce((profile: any, setting: any) => {
      profile[setting.key] = setting.value;
      return profile;
    }, {});

    res.json(userProfile);
  } catch (error) {
    handleError(error, res);
  }
});

// Address Routes
// Fetch User Address
v1Router.get('/user/address', async (req: any, res: any) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id }
    });
    res.json(addresses);
  } catch (error) {
    handleError(error, res);
  }
});

// Create User Address
v1Router.post('/user/address', async (req: any, res) => {
  try {
    const { address_line1, address_line2, street, city, state, country,latitude, longitude, addressType, landmark, postalCode } = req.body;
    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        address_line1,
        address_line2,
        street,
        city,
        state,
        country,
        latitude,
        longitude,
        addressType,
        landmark,
        postalCode
      }
    });
    res.json({ message: 'Address created successfully', id: address.id });
  } catch (error) {
    handleError(error, res);
  }
});

// Cart Routes
// Create Cart Details with Items
v1Router.post('/cart', async (req: any, res) => {
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

// Fetch Cart Details
v1Router.get('/cart/:id', async (req: any, res: any) => {
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
// Create Order with a Cart
v1Router.post('/cart/:id', async (req: any, res: any) => {
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

// Fetch Orders of a User
v1Router.get('/order', async (req: any, res: any) => {
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

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'No orders found for this user' });
    }

    res.json({ orders });
  } catch (error) {
    handleError(error, res);
  }
});

// Fetch single order of a User 
v1Router.get('/order/:id', async (req: any, res: any) => {
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

v1Router.get('/order/:id/track', async (req: any, res: any) => {
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

v1Router.post('/order/:id/cancel', async (req: any, res: any) => {

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
    const response = await fetch('https://ondc-api.kiko.live/ondc-seller-v2/kiranapro-cancel-order', {
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

// Notification Routes
// Fetch all notifications for a user
v1Router.get('/notifications', async (req: any, res: any) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdDate: 'desc', // Sort notifications by creation time (latest first)
      },
    });

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'No notifications found' });
    }

    res.json({ notifications });
  } catch (error) {
    handleError(error, res);
  }
});

// Create notifications for a User
v1Router.post('/notifications', async (req: any, res: any) => {
  try {
    const { message, media_url } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create a new notification
    const newNotification = await prisma.notification.create({
      data: {
        message: message,
        mediaUrl: media_url || '',  // Optional field
      },
    });

    res.status(201).json({
      message: 'Notification added successfully',
      notification: newNotification,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Delete Notification of a User
v1Router.delete('/notifications/:id', async (req: any, res: any) => {
  const notificationId = req.params.id;

  try {
    // Find and delete the notification with the provided ID
    const deletedNotification = await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    res.status(200).json({
      message: 'Notification deleted successfully',
      notification: deletedNotification,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Payment Routes
v1Router.post('/payment', async (req: any, res: any) => {
  try {
    const { amount } = req.body;
    const payment = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      payment_capture: true
    });
    res.status(200).json(payment);
  } catch (error) {
    handleError(error, res);
  }
});


v1Router.post('/payment/verify', async (req: any, res: any) => {
  try {
    const { order_id, payment_id, signature } = req.body;
    const secret = process.env.RAZORPAY_SECRET || 'rzp_secret_xxx';

    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(order_id + '|' + payment_id);

    const generatedSignature = hmac.digest("hex")
    
    if(generatedSignature === signature){
      res.status(200).json({
        success: true,
        message: "Payment verified!"
      });
    }
    res.status(400).json({
      success: false,
      message: "Payment not verified!"
    })
    
  } catch (error) {
    handleError(error, res);
  }
});

// Task Routes
v1Router.post('/agent', async (req: any, res) => {
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

v1Router.get('/task/:taskId', async (req: any, res: any) => {
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


// Home banner and Carousel Asset

v1Router.get('/home', async (req: any, res: any) => {
  try {

    type Banner = string;

    interface CarouselItem {
      id: string;
      image_url: string;
    }

    function createBanners(count: number): Banner[] {
      return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/picsum/200/300`);
    }

    function createCarousel(count: number): CarouselItem[] {
      return Array.from({ length: count }, (_, i) => ({
        id: (i + 1).toString(),
        image_url: `https://picsum.photos/200/300?grayscale`,
      }));
    }

    const banners = createBanners(5);
    const carousels = createCarousel(5);

    res.status(200).json({
      banner: banners,
      carousel: carousels
    })
  } 
  catch (error) {
    handleError(error, res);
  }
});


// Upload Audio 
// Middleware to handle audio file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for simplicity
  fileFilter: (req, file, cb) => {
      if (file.mimetype === 'audio/mpeg') {
          cb(null, true); // Accept MP3 files
      } else {
          cb(new Error('Only MP3 files are allowed!'));
      }
  },
});

// Upload audio endpoint

v1Router.post(
  '/audio',
  upload.single('audio'), // Expect an 'audio' file in the request
  async (req: any, res: any) => {
  try {
      // Extract the User-Agent header
      const userAgent = req.headers['user-agent'];

      if (!userAgent && !userAgent.includes('lat:') && !userAgent.includes('lon:')) {
        return res.status(400).json({ error: 'Some headers are missing' });
      }
      
      const latLonRegex = /lat:\s*([\d.-]+);\s*lon:\s*([\d.-]+)/;
      const match = userAgent.match(latLonRegex);

      if (!match) {
        return res.status(400).json({ error: 'Latitude and longitude not found in header' });
      }

      // Extract latitude and longitude
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);

      // Use type assertion to access `file`
      const file = req.file;
      if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create FormData to send the file
      const formData = new FormData();

      try {
        // Convert the buffer into a Blob
        const audioBlob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('audio', audioBlob, file.originalname);
         
      } catch (error: any) {
        res.json({ error: error.message})
      }

      // Perform the fetch call with multipart/form-data
      const response = await fetch('https://dev-ai-api.kpro42.com/api/process-audio', {
        method: 'POST',
        body: formData, // Use FormData as the body
      });

      // Parse the response
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to process audio' });
      }
      const data = await response.json();

      try {
        const cart = await convertToCart(data, latitude, longitude)
        res.status(200).json(cart)
      } catch (error: any) {
        res.json({ error: error.message})
      }
  } catch (error) {
    handleError(error, res);
  }
})

// Routes for handling kiko integrations
/**
 * No swagger
 */
v1Router.post('/kikoOrderStatus', async (req: any, res: any) => {
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

/**
 * Swagger Required
 */
v1Router.post('/order', async (req: any, res: any) => {
  const order = req.body;

  // Ensure the request body contains `pincode`
  if (!order) {
    return res.status(400).json({ error: 'order is required' });
  }

  try {
    // Fetch request to the external API
    const response = await fetch('https://ondc-api.kiko.live/ondc-seller-v2/kiranapro-create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    // Parse the response
    const data = await response.json();

    // Forward the external API response back to the client
    return res.status(200).json(data);
  } catch (error) {
    handleError(error, res);
  }
})

// Route for handling ONDC subscription requests
/**
 * @swagger
 * /on_subscribe:
 *   post:
 *     summary: ONDC Subscribe BACKEND API
 *     description: Decrypts the provided 'string' using AES-256-ECB and returns the answer.
 *     tags:
 *       - ONDC - Backend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriber_id:
 *                 type: string
 *                 description: The encrypted string to decrypt.
 *                 example: 'dev-api.kpro42.com'
 *               challenge:
 *                 type: string
 *                 description: The encrypted string to decrypt.
 *                 example: 'challengeString'
 *     responses:
 *       200:
 *         description: Successful response with the decrypted answer.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: The decrypted answer to the given string.
 *                   example: 'decryptedAnswerHere'
 *       400:
 *         description: Bad request, typically when 'string' is missing or invalid.
 *       500:
 *         description: Internal server error if decryption fails or other server issues occur.
 */
ondcRouter.post('/on_subscribe', function (req: any, res: any) {
  try {
    const { challenge } = req.body; // Extract the 'challenge' property from the request body
    const answer = decryptAES256ECB(sharedKey, challenge); // Decrypt the challenge using AES-256-ECB
    const resp = { answer: answer };
    res.status(200).json(resp); // Send a JSON response with the answer
  } catch (error: any) {
    res.status(500).json({ error: error });
  }
});

// Route for serving a ONDC verification file
/**
 * @swagger
 * /ondc-site-verification.html:
 *   get:
 *     summary: ONDC HTML verification file BACKEND API
 *     description: DO NOT TAMPER! Returns a verification HTML file with a signed unique request ID, using the specified signing key.
 *     tags:
 *       - ONDC - Backend
 *     responses:
 *       200:
 *         description: HTML verification file with signed request ID.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error if signing or file processing fails.
 */
ondcRouter.get('/ondc-site-verification.html', async (req: any, res: any) => {
  try {
    const signedContent = await signMessage(REQUEST_ID, ONDC_SIGNING_PRIVATE_KEY);
    // Replace the placeholder with the actual value
    const modifiedHTML = htmlFile.replace(/SIGNED_UNIQUE_REQ_ID/g, signedContent);
    // Send the modified HTML as the response
    res.send(modifiedHTML);
  } catch (error: any) {
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
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health-check', (req: any, res: any) => { res.status(200).json({ health: "OK" }) });
app.use('/', ondcRouter);
app.use('/v1', middleware.decodeToken, v1Router);

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