import express from 'express';
import prisma from '../config/prisma.config';
import handleError from '../helper/handleError';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

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

// JWT Authentication Routes
authRouter.post('/auth/continue', async (req: any, res: any) => {
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
authRouter.get('/auth/verify-token', async (req: any, res: any) => {
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