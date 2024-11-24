// src/server.ts
import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
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

// Profile Routes

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create user settings as key-value pairs
 *     description: Creates user settings such as name, email, and phone as individual key-value pairs in the database.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *             required:
 *               - name
 *               - email
 *               - phone
 *     responses:
 *       201:
 *         description: User settings created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Settings created successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Validation error
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
v1Router.post('/user', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, email, phone } = req.body;

    const data = [
      { key: "name", value: name },
      { key: "email", value: email },
      { key: "phone", value: phone },
    ];

    // Use a loop for await Prisma calls
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

/**
 * @swagger
 * /user:
 *   put:
 *     summary: Update user profile
 *     description: Updates the user's profile settings such as name, email, and phone. If the keys already exist, their values are updated.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: [] # Token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name.
 *                 example: user
 *               email:
 *                 type: string
 *                 description: The user's email address.
 *                 example: user@website.com
 *               phone:
 *                 type: string
 *                 description: The user's phone number.
 *                 example: +919999999999
 *     responses:
 *       201:
 *         description: User profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Settings updated successfully
 *       400:
 *         description: Bad request - Invalid or missing request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
v1Router.put('/user', authenticateToken, async (req: any, res: any) => {
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

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Fetch user profile
 *     description: Retrieves user profile information such as name, email, and phone in a structured format.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: user
 *                 email:
 *                   type: string
 *                   example: user@website.com
 *                 phone:
 *                   type: string
 *                   example: +919999999999
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
v1Router.get('/user', authenticateToken, async (req: any, res) => {
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

   order.id

    res.json({ order_id: order.id });
  } catch (error) {
    handleError(error, res);
  }
});

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
v1Router.get('/order', authenticateToken, async (req: any, res: any) => {
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

// Notification Routes
/**
 * @swagger
 * /v1/notification:
 *   get:
 *     summary: Get all notifications
 *     description: Retrieve a list of all notifications.
 *     tags:
 *       - Notification
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the notification.
 *                   message:
 *                     type: string
 *                     description: The message content of the notification.
 *                   media_url:
 *                     type: string
 *                     description: URL to the media associated with the notification (if any).
 *                   created_date:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the notification was created.
 *       500:
 *         description: Server error or issue retrieving notifications.
 */
v1Router.get('/notifications', authenticateToken, async (req: any, res: any) => {
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

/**
 * @swagger
 * /v1/notification:
 *   post:
 *     summary: Add a new notification
 *     description: Creates a new notification in the system.
 *     tags:
 *       - Notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content of the notification.
 *               media_url:
 *                 type: string
 *                 description: Optional URL for media associated with the notification.
 *     responses:
 *       201:
 *         description: Successfully added the notification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier of the created notification.
 *                     message:
 *                       type: string
 *                       description: The content of the notification.
 *                     media_url:
 *                       type: string
 *                       description: URL to the media associated with the notification.
 *                     created_date:
 *                       type: string
 *                       format: date-time
 *                       description: The date and time when the notification was created.
 *       400:
 *         description: Invalid request body (e.g., missing message).
 *       500:
 *         description: Internal server error.
 */
v1Router.post('/notifications', authenticateToken, async (req: any, res: any) => {
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

/**
 * @swagger
 * /v1/notification/{id}:
 *   delete:
 *     summary: Delete a notification by ID
 *     description: Deletes a specific notification by its unique ID.
 *     tags:
 *       - Notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the notification to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted the notification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message indicating that the notification has been deleted.
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID of the deleted notification.
 *                     message:
 *                       type: string
 *                       description: The content of the deleted notification.
 *                     media_url:
 *                       type: string
 *                       description: URL to the media associated with the deleted notification.
 *                     created_date:
 *                       type: string
 *                       format: date-time
 *                       description: The date and time when the notification was created.
 *       404:
 *         description: Notification not found for the specified ID.
 *       500:
 *         description: Internal server error.
 */
v1Router.delete('/notifications/:id', authenticateToken, async (req: any, res: any) => {
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

/**
 * @swagger
 * /v1/payment/verify:
 *   post:
 *     summary: Verify payment using Razorpay payment details
 *     description: This endpoint verifies the payment by comparing the generated signature with the provided signature from Razorpay.
 *     tags:
 *       - Payment
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         description: The details required to verify the payment.
 *         schema:
 *           type: object
 *           properties:
 *             order_id:
 *               type: string
 *               description: The unique order ID from Razorpay.
 *             payment_id:
 *               type: string
 *               description: The payment ID generated by Razorpay for the payment.
 *             signature:
 *               type: string
 *               description: The signature generated by Razorpay, used to verify the payment.
 *     responses:
 *       200:
 *         description: Payment successfully verified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the payment verification was successful.
 *                 message:
 *                   type: string
 *                   description: Message indicating the verification result.
 *       400:
 *         description: Payment verification failed due to signature mismatch or other errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the payment verification failed.
 *                 message:
 *                   type: string
 *                   description: Message explaining the failure reason.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates that an error occurred during payment verification.
 *                 message:
 *                   type: string
 *                   description: Error message for internal issues.
 */
v1Router.post('/payment/verify', authenticateToken, async (req: any, res: any) => {
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


// Home banner and Carousel Asset
/**
 * @swagger
 * /v1/home:
 *   get:
 *     summary: Retrieve home screen data
 *     description: Returns banners, carousels, and categories for the home screen.
 *     tags:
 *       - Home
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved home screen data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banner:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: https://placehold.co/240x320
 *                   description: A list of banner image URLs.
 *                 carousel:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       image_url:
 *                         type: string
 *                         example: https://placehold.co/240x320
 *                   description: A list of carousel items with IDs and image URLs.
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       image_url:
 *                         type: string
 *                         example: https://placehold.co/240x320
 *                   description: A list of category items with IDs and image URLs.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred
 */

v1Router.get('/home', authenticateToken, async (req: any, res: any) => {
  try {

    type Banner = string;

    interface CarouselItem {
      id: string;
      image_url: string;
    }

    function createBanners(count: number): Banner[] {
      return Array.from({ length: count }, (_, i) => `https://placehold.co/240x320`);
    }

    function createCarousel(count: number): CarouselItem[] {
      return Array.from({ length: count }, (_, i) => ({
        id: (i + 1).toString(),
        image_url: `https://placehold.co/240x320`,
      }));
    }

    function createCategories(count: number): CarouselItem[] {
      return Array.from({ length: count }, (_, i) => ({
        id: (i + 1).toString(),
        image_url: `https://placehold.co/240x320`,
      }));
    }

    const banners = createBanners(5);
    const carousels = createCarousel(5);
    const categories = createCategories(5);

    res.status(200).json({
      banner: banners,
      carousel: carousels,
      categories: categories
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
/**
 * @swagger
 * /v1/audio:
 *   post:
 *     summary: Upload an audio file and retrieve cart details
 *     description: This endpoint allows users to upload an audio file (MP3 format only) and receive a response containing a sample cart structure.
 *     tags:
 *       - Audio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: The MP3 file to upload.
 *     responses:
 *       200:
 *         description: Audio file uploaded successfully and cart details returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: cart_123
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: item_123
 *                           name:
 *                             type: string
 *                             example: Sample Item
 *                           price:
 *                             type: number
 *                             example: 20
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                     subTotal:
 *                       type: number
 *                       example: 40
 *                     shipping:
 *                       type: number
 *                       example: 10
 *                     total:
 *                       type: number
 *                       example: 50
 *       400:
 *         description: Bad Request - No file uploaded or invalid file type.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No file uploaded
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred
 */

v1Router.post(
  '/audio',
  authenticateToken,
  upload.single('audio'), // Expect an 'audio' file in the request
  async (req: any, res: any) => {
      try {
          // Use type assertion to access `file`
          const file = (req as any).file;
          if (!file) {
              return res.status(400).json({ error: 'No file uploaded' });
          }

          // Respond with the cart ID
          res.status(200).json({
              message: 'File uploaded successfully',
              cart: {
                id: "cart_123",
                items: [
                  {
                    id: "item_123",
                    name: "Sample Item",
                    price: 20,
                    quantity: 2
                  }
                ],
                subTotal: 40,
                shipping: 10,
                total: 50
              },
          });
  } catch (error) {
    handleError(error, res);
  }
})

// Route for handling ONDC subscription requests
/**
 * @swagger
 * /on_subscribe:
 *   post:
 *     summary: ONDC Subscribe API
 *     description: Decrypts the provided 'string' using AES-256-ECB and returns the answer.
 *     tags:
 *       - ONDC
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
 *     summary: ONDC HTML verification file API
 *     description: DO NOT TAMPER! Returns a verification HTML file with a signed unique request ID, using the specified signing key.
 *     tags:
 *       - ONDC    
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
app.use('/', ondcRouter);
app.use('/v1', v1Router);
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health-check', (req: any, res: any) => { res.status(200).json({ health: "OK" }) });

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