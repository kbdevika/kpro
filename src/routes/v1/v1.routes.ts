import express, { Router } from "express";
import handleError from "../../helper/handleError";
import multer from 'multer';

import { HomeController } from "../../controllers/home.controller";
import { CartController } from "../../controllers/cart.controller";
import { AudioController } from "../../controllers/audio.controller";
import { NotificationController } from "../../controllers/notification.controller";
import { PaymentsController } from "../../controllers/payment.controller";
import { TaskController } from "../../controllers/task.controller";
import { UserController } from "../../controllers/user.controller";
import { OrdersController } from "../../controllers/order.controller";
import { AIController } from "../../controllers/ai.controller";

export class V1Router {
  public router: Router;
  private aiController: AIController;
  private homeController: HomeController;
  private cartController: CartController;
  private audioController: AudioController;
  private notificationController: NotificationController;
  private paymentsController: PaymentsController;
  private taskController: TaskController;
  private userController: UserController;
  private ordersController: OrdersController;


  constructor() {
    this.router = express.Router();
    this.aiController = new AIController();
    this.homeController = new HomeController();
    this.cartController = new CartController();
    this.audioController = new AudioController();
    this.notificationController = new NotificationController();
    this.paymentsController = new PaymentsController();
    this.taskController = new TaskController();
    this.userController = new UserController();
    this.ordersController = new OrdersController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const upload = multer({
        storage: multer.memoryStorage(),
        fileFilter: (req, file, cb) => {
          if (file.mimetype === 'audio/mpeg') {
            cb(null, true);
          } else {
            cb(null, false);
          }
        },
      });
  
    this.router.post('/audio', upload.single('audio'), this.processAudio);
    this.router.get("/ai", this.getPincodeAvailability);
    this.router.get("/ai/:taskId", this.getCartStatus);
    this.router.get("/home", this.getHome);
    this.router.get("/cart", this.getAllCarts);
    this.router.get("/cart/:id", this.getCartbyId);
    this.router.post("/cart/coupon", this.updateCartWithCoupon);
    this.router.post("/cart", this.createCart);
    this.router.put("/cart/:id", this.updateCart);
    this.router.delete("/cart/:id", this.deleteCartbyId);
    this.router.get("/notifications", this.getNotifications);
    this.router.post("/notifications", this.createNotification);
    this.router.delete("/notifications/:id", this.deleteNotification);
    this.router.post("/payment", this.createPayment);
    this.router.post("/payment/verify", this.verifyPayment);
    this.router.post("/task", this.createTask);
    this.router.get("/task/:taskId", this.getTask);
    this.router.put("/user", this.updateProfile);
    this.router.get("/user", this.getProfile);
    this.router.get("/user/settings", this.getUserSettings);
    this.router.post("/user/settings", this.createUserSetting);
    this.router.put("/user/settings/:key", this.updateUserSetting);
    this.router.delete("/user/settings/:key", this.deleteUserSetting);
    this.router.get("/user/address", this.getUserAddresses);
    this.router.get("/user/address/:id", this.getUserAddressById);
    this.router.post("/user/address", this.createUserAddress);
    this.router.delete("/user/address/:id", this.deleteUserAddress);
    this.router.get("/order", this.getOrders);
    this.router.post("/order", this.createOrder);
    this.router.get("/order/:id", this.getOrder);
    this.router.get("/order/:id/track", this.trackOrder);
    this.router.post("/order/:id/cancel", this.cancelOrder);
  }

  private processAudio = async (req: any, res: any): Promise<void> => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Only MP3 files are allowed!' });
      }

      const userAgent = req.headers['user-agent'];
      const file = req.file;
      const response = await this.audioController.processAudio(userAgent, file);
      res.status(200).json(response);
    } catch (error) {
      handleError(error, res)
    }
  };

  private getCartStatus = async (req: any, res: any) => {
    try {
      const data = await this.aiController.getCartStatus(req.params.taskId, req);
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

  private getHome = async (req: any, res: any) => {
    try {
      const data = await this.homeController.getHome(req);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

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

  private updateCartWithCoupon = async (req: any, res: any) => {
    try {
      const data = await this.cartController.updateCartWithCouponCode(req.body)
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getNotifications = async (req: any, res: any) => {
    try {
      const data = await this.notificationController.getNotifications(req);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private createNotification = async (req: any, res: any) => {
    try {
      const data = await this.notificationController.createNotification(req.body);
      res.status(201).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private deleteNotification = async (req: any, res: any) => {
    try {
      const data = await this.notificationController.deleteNotification(req.params.id);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private createPayment = async (req: any, res: any) => {
    try {
      const data = await this.paymentsController.createPayment(req.body);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private verifyPayment = async (req: any, res: any) => {
    try {
      const data = await this.paymentsController.verifyPayment(req, req.body);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private createTask = async (req: any, res: any) => {
    try {
      const data = await this.taskController.createTask(req, req.body);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getTask = async (req: any, res: any) => {
    try {
      const data = await this.taskController.getTask(req, req.params.taskId);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private updateProfile = async (req: any, res: any) => {
    try {
      const data = await this.userController.updateProfile(req, req.body);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getProfile = async (req: any, res: any) => {
    try {
      const data = await this.userController.getProfile(req);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getUserSettings = async (req: any, res: any) => {
    try {
      const data = await this.userController.getUserSettings(req);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private createUserSetting = async (req: any, res: any) => {
    try {
      const data = await this.userController.createUserSetting(req, req.body);
      res.status(201).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private updateUserSetting = async (req: any, res: any) => {
    try {
      const data = await this.userController.updateUserSetting(req, req.params.key, req.body);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private deleteUserSetting = async (req: any, res: any) => {
    try {
      const data = await this.userController.deleteUserSetting(req, req.params.key);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getUserAddresses = async (req: any, res: any) => {
    try {
      const data = await this.userController.getUserAddresses(req);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getUserAddressById = async (req: any, res: any) => {
    try {
      const data = await this.userController.getUserAddressById(req.params.id, req);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private createUserAddress = async (req: any, res: any) => {
    try {
      const data = await this.userController.createUserAddress(req, req.body);
      res.status(201).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private deleteUserAddress = async (req: any, res: any) => {
    try {
      const data = await this.userController.deleteUserAddress(req.params.id, req);
      res.status(200).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getOrders = async (req: any, res: any) => {
    try {
      const data = await this.ordersController.getOrders(req);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private createOrder = async (req: any, res: any) => {
    try {
      const data = await this.ordersController.createOrder(req, req.body);
      res.status(201).json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private getOrder = async (req: any, res: any) => {
    try {
      const data = await this.ordersController.getOrder(req, req.params.id);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private trackOrder = async (req: any, res: any) => {
    try {
      const data = await this.ordersController.trackOrder(req, req.params.id);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

  private cancelOrder = async (req: any, res: any) => {
    try {
      const data = await this.ordersController.cancelOrder(req, req.params.id);
      res.json(data);
    } catch (error) {
      handleError(error, res);
    }
  };

}

export default new V1Router().router;