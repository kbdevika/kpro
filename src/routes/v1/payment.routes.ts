import express from 'express';
import handleError from '../../helper/handleError';
import crypto from 'crypto';
import RazorPay from 'razorpay';
import * as dotenv from 'dotenv';
import orderToKikoOrder from '../../helper/orderToKikoOrder';
import convertToOrderSummary from '../../helper/convertToOrderSummary';
import kikoUrl from '../../constants';

dotenv.config();

const paymentRouter = express.Router();

// Razorpay Configuration
const razorpay = new RazorPay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxx',
  key_secret: process.env.RAZORPAY_SECRET || 'xxx'
});


/**
 * @swagger
 * /payment:
 *   post:
 *     summary: Initiate a payment
 *     description: Creates a payment order with Razorpay for the specified amount.
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2000
 *     responses:
 *       200:
 *         description: Payment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "pay_123"
 *                 amount:
 *                   type: number
 *                   example: 50000
 *                 currency:
 *                   type: string
 *                   example: "INR"
 *                 payment_capture:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
paymentRouter.post('/', async (req: any, res: any) => {
    try {
      let { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Missing or invalid inputs!' });
      } 

      // Validate if the amount is an integer-convertible string
      amount = parseFloat(parseFloat(amount).toFixed(2));

      // Validate if the amount is now a positive number
      if (isNaN(amount) || amount <= 0) {
          return res.status(400).json({ error: 'Amount must be a positive number!' });
      }
 
      // Convert the amount to paisa (if not already in paisa)
      amount = Math.round(amount * 100);

      // Convert the amount to paisa
      const payment = await razorpay.orders.create({
        amount: amount,
        currency: 'INR',
        payment_capture: true
      });
      res.json(payment);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  
  /**
 * @swagger
 * /payment/verify:
 *   post:
 *     summary: Verify payment using Razorpay payment details
 *     description: This endpoint verifies the payment by comparing the generated signature with the provided signature from Razorpay.
 *     tags:
 *       - Payment
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         description: The details required to verify the payment.
 *         schema:
 *           type: object
 *           properties:
 *             order_id:
 *               type: string
 *               description: The unique order ID from Razorpay.
 *             payment_id:
 *               type: string
 *               description: The payment ID generated by Razorpay for the payment.
 *             signature:
 *               type: string
 *               description: The signature generated by Razorpay, used to verify the payment.
 *     responses:
 *       200:
 *         description: Payment successfully verified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the payment verification was successful.
 *                 message:
 *                   type: string
 *                   description: Message indicating the verification result.
 *       400:
 *         description: Payment verification failed due to signature mismatch or other errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the payment verification failed.
 *                 message:
 *                   type: string
 *                   description: Message explaining the failure reason.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates that an error occurred during payment verification.
 *                 message:
 *                   type: string
 *                   description: Error message for internal issues.
 */

  paymentRouter.post('/verify', async (req: any, res: any) => {
    try {
      const { order_id, payment_id, signature, cart_id, address_id } = req.body;

      if(!order_id || !payment_id ||  !signature || !cart_id || !address_id){
        return res.status(400).json({ error: 'Missing or invalid inputs!'})
      }

      const secret = process.env.RAZORPAY_SECRET || 'rzp_secret_xxx';
  
      const hmac = crypto.createHmac("sha256", secret)
      hmac.update(order_id + '|' + payment_id);
  
      const generatedSignature = hmac.digest("hex")
      
      if(generatedSignature === signature){
        const { order, _order } = await orderToKikoOrder(cart_id.toString(), req.user.id, parseInt(address_id))
        const orderSummary = convertToOrderSummary(_order)
        
        // Development environment: return early with mock data
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'localhost' || process.env.NODE_ENV === 'production') {
          return res.json({
            success: true,
            message: "Order to Kiko is disabled in development mode",
            orderSummary
          });
        }
        
        // Fetch request to the external API
        const response = await fetch(`${kikoUrl}/kiranapro-create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
  
        // Handle external API response
        if (!response.ok) {
          const errorMessage = await response.text(); // Capture error message from API
          return res.status(response.status).json({
            error: `Failed to create order!`,
            details: errorMessage,
          });
        }
    
        // Parse the response and forward the external API response back to the client
        const data = await response.json();
  
        if(data.Status === false && data.outOfStock === true){
          return res.status(409).json({ success: true, message: 'out-of-stock'});
        }
  
        if(data.Status === true){
          return res.json({success: true, message: 'order-success', orderSummary});
        }
  
        return res.json({ status: true, message: 'order-failed', ...data})
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