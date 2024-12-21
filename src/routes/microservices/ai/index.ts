import express, { Router } from "express";
import { AIController } from "../../../controllers/ai.controller";
import handleError from "../../../helper/handleError";

export class AIRouter {
  public router: Router;
  private aiController: AIController;

  constructor() {
    this.router = express.Router();
    this.aiController = new AIController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", this.getPincodeAvailability);
    this.router.get("/:taskId", this.getCartStatus);
    this.router.post("/search", this.searchItems);
  }

  private getCartStatus = async (req: any, res: any) => {
    try {
      const data = await this.aiController.getCartStatus(req.params.taskId, req.user.id);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private searchItems = async (req: any, res: any) => {
    try {
      const data = await this.aiController.searchItems(req.body);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getPincodeAvailability = async (req: any, res: any) => {
    try {
      const data = await this.aiController.getPincodeAvailability(req.headers["user-agent"]);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };
}

// Export an instance of the router
export default new AIRouter().router;