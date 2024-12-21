import express, { Router } from "express";
import { KikoController } from "../../controllers/kiko.controller";
import handleError from "../../helper/handleError";

export class KikoRouter {
  public router: Router;
  private kikoController: KikoController;

  constructor() {
    this.router = express.Router();
    this.kikoController = new KikoController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/", this.updateOrder);
  }

  private updateOrder = async (req: any, res: any) => {
    try {
      const data = await this.kikoController.updateOrder(req.body);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };
}

export default new KikoRouter().router;