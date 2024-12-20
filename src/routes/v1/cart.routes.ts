import express, { Router } from "express";
import handleError from "../../helper/handleError";
import { CartController } from "../../controllers/cart.controller";

export class CartRouter {
  public router: Router;
  private cartController: CartController

  constructor() {
    this.router = express.Router();
    this.cartController = new CartController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", this.getAllCarts);
    this.router.get("/:id", this.getCartbyId);
    this.router.post("/", this.createCart);
    this.router.put("/:id", this.updateCart);
    this.router.delete("/:id", this.deleteCartbyId);
  }

  private updateCart = async (req: any, res: any) => {
    try {
      const data = await this.cartController.updateCart(req, req.params.id, req.body)
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private createCart = async (req: any, res: any) => {
    try {
      const data = await this.cartController.createCart(req, req.body)
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getCartbyId = async (req: any, res: any) => {
    try {
      const cart = await this.cartController.getCartbyId(req, req.params.id)
  
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      res.json(cart);
    } catch (error) {
      handleError(error, res);
    }
  }

  private getAllCarts = async (req: any, res: any) => {
    try {
      const cart = await this.cartController.getAllCarts(req)
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      res.json(cart);

    } catch (error) {
      handleError(error, res);
    }
  }

  private deleteCartbyId = async (req: any, res: any) => {
    try {
      const data = await this.cartController.deleteCartbyId(req.params.id, req)
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };
}

export default new CartRouter().router;