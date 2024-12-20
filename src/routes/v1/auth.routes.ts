import express, { Router, Request, Response } from 'express';
import middleware from '../../middleware';
import handleError from '../../helper/handleError';
import { AuthController } from '../../controllers/auth.controller';

export class AuthRouter {
  public router: Router;

  private authController: AuthController;

  constructor() {
    this.router = express.Router();
    this.authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/continue', this.getJWTAuth);
    this.router.get('/verify-token', middleware.decodeFirebaseToken, this.getFirebaseAuth);
  }

  private getJWTAuth = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const response = await this.authController.getJWTAuth(token);
      res.json(response);
    } catch (error) {
      handleError(error, res)
    }
  };

  private getFirebaseAuth = async (req: Request, res: Response) => {
    try {
      const response = await this.authController.getFirebaseAuth(req);
      res.json(response);
    } catch (error) {
      handleError(error, res)
    }
  };
}

export default new AuthRouter().router