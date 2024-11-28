import express from 'express';
import handleError from '../../helper/handleError';
import crypto from 'crypto';
import RazorPay from 'razorpay';
import * as dotenv from 'dotenv';

dotenv.config();

const paymentRouter = express.Router();

// Razorpay Configuration
const razorpay = new RazorPay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxx',
  key_secret: process.env.RAZORPAY_SECRET || 'xxx'
});


// Payment Routes
paymentRouter.post('/', async (req: any, res: any) => {
    try {
      const { amount } = req.body;
      const payment = await razorpay.orders.create({
        amount: amount,
        currency: 'INR',
        payment_capture: true
      });
      res.status(200).json(payment);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  
  paymentRouter.post('/verify', async (req: any, res: any) => {
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

export default paymentRouter;