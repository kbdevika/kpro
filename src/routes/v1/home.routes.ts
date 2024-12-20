import express, { Router } from "express";
import { HomeController } from "../../controllers/home.controller";
import handleError from "../../helper/handleError";

export class HomeRouter {
  public router: Router;
  private homeController: HomeController;

  constructor() {
    this.router = express.Router();
    this.homeController = new HomeController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/home", this.getHome);
  }

  private getHome = async (req: any, res: any) => {
    try {
      const data = await this.homeController.getHome(req);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };
}

// Export an instance of the router
export default new HomeRouter().router;
