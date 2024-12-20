import { Route, Tags, Post, Get, Body, Path, Request } from 'tsoa';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import prisma from '../config/prisma.config';

dotenv.config();

// JWT Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRE_MINUTES = 525600;

// Helper Function
const createAccessToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, SECRET_KEY, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
};

interface JWTAuthResponse {
  access_token: string;
  token_type: string;
}

interface FirebaseAuthResponse {
  verified: boolean;
  auth: string | undefined;
}

@Route('auth')
@Tags('Auth')
export class AuthController {
  /**
   * Generate a JWT for the user
   * @param token Truecaller token to validate and generate a JWT
   * @returns An access token with bearer type
   */
  @Post('/continue')
  public async getJWTAuth(
    @Body() token: string,
  ): Promise<JWTAuthResponse> {
    // Validate Truecaller token (mock validation here)
    const userId = token;

    let user = await prisma.userModel.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.userModel.create({
        data: { id: userId },
      });
    }

    const accessToken = createAccessToken(user.id);
    return { access_token: accessToken, token_type: 'bearer' };
  }

  /**
   * Verify Firebase authentication
   * @param id The Firebase user ID
   * @param auth The authorization header
   * @returns Firebase authentication status
   */
  @Get('/verify-token')
  public async getFirebaseAuth(
    @Request() req: any
  ): Promise<FirebaseAuthResponse> {
    return {
      verified: true,
      auth: req.headers.authorization,
    };
  }
}
