import express from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import middleware from '../../middleware';

dotenv.config();
const authRouter = express.Router()

// JWT Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRE_MINUTES = 525600;

// Helper Functions
const createAccessToken = (userId: string): string => {
    return jwt.sign(
      { sub: userId },
      SECRET_KEY,
      { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` }
    );
  };

/**
 * @swagger
 * /auth/continue:
 *   post:
 *     summary: Authenticate user via JWT token
 *     description: Authenticate the user using a token and provide a JWT.
 *     tags:
 *       - Authentication (Backend)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Your token to authenticate.
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
authRouter.post('/continue', async (req: any, res: any) => {
    try {
      const { token } = req.body;
      // Validate Truecaller token (implement actual validation)
      const userId = token;
  
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


/**
 * @swagger
 * /auth/verify-token:
 *   get:
 *     summary: Verify firebase authentication token
 *     description: Verifies the token provided in the request header - bearer and returns the verification status.
 *     tags:
 *       - Authentication (Backend)   
 *     responses:
 *       200:
 *         description: Successfully verified the token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                   example: true
 *                 auth:
 *                   type: string
 *                   example: "Bearer <token>"
 *       400:
 *         description: Bad request, possibly due to missing or invalid token
 *       500:
 *         description: Internal server error
 */
authRouter.get('/verify-token', middleware.decodeFirebaseToken, async (req: any, res: any) => {
  try {
        res.json({ 
        verified: true, 
        auth: req.headers.authorization 
      });
  } catch (error) {
    handleError(error, res);
  }
});

export default authRouter;