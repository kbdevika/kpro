import { Controller, Post, Route, Tags, Body, Response, Security } from "tsoa";
import RazorPay from "razorpay";
import crypto from "crypto";
import orderToKikoOrder from "../helper/orderToKikoOrder";
import kikoUrl, { activateActualOrder } from "../constants";

interface VerifyPaymentRequest {
  order_id: string;
  payment_id: string;
  signature: string;
  cart_id: string;
  address_id: string;
  userId: string;
}

interface RazorPayOrderResponse {
  id: string;
  entity: string;
  amount: number | string;
  currency: string;
  receipt?: string | undefined;
  status: string;
  created_at: number;
}

@Route("payment")
@Tags("Payments")
@Security("jwt")
export class PaymentsController extends Controller {
  private razorpay: RazorPay;

  constructor() {
    super();
    this.razorpay = new RazorPay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_xxx",
      key_secret: process.env.RAZORPAY_SECRET || "xxx",
    });
  }

  /**
   * Create a new Razorpay payment order.
   * @param amount The amount to be paid in INR.
   * @returns The Razorpay order details.
   */
  @Post("/")
  @Response(400, "Missing or invalid inputs")
  public async createPayment(@Body() body: { amount: number }): Promise<RazorPayOrderResponse> {
    const { amount: inputAmount } = body;

    if (!inputAmount || typeof inputAmount !== "number" || inputAmount <= 0) {
      this.setStatus(400);
      throw new Error("Amount must be a positive number!");
    }

    const amount = Math.round(inputAmount * 100);
    return this.razorpay.orders.create({
      amount,
      currency: "INR",
      payment_capture: true,
    });
  }

  /**
   * Verify a Razorpay payment and create an order.
   * @param body The request body with payment and order details.
   * @returns A success message or an error.
   */
  @Post("/verify")
  @Response(400, "Missing or invalid inputs")
  public async verifyPayment(@Body() body: VerifyPaymentRequest): Promise<{ success: boolean; message: string; order?: any }> {
    const { order_id, payment_id, signature, cart_id, address_id, userId } = body;

    if (!order_id || !payment_id || !signature || !cart_id || !address_id) {
      this.setStatus(400);
      return {
        success: false,
        message: "invalid-inputs"
      };
    }

    const secret = process.env.RAZORPAY_SECRET || "rzp_secret_xxx";
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      this.setStatus(400);
      return {
        success: false,
        message: "payment-failed"
      };
    }

    const { kikoOrder, order } = await orderToKikoOrder(cart_id, userId, address_id);

    if (activateActualOrder) {
      return {
        success: true,
        message: "Order to Kiko is disabled in development mode",
        order,
      };
    }

    const response = await fetch(`${kikoUrl}/kiranapro-create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kikoOrder),
    });

    if (!response.ok) {
      this.setStatus(response.status);
      return {
        success: true,
        message: "order-not-placed"
      };
    }

    const data = await response.json();

    if (data.Status === false && data.outOfStock === true) {
      return { success: true, message: "out-of-stock" };
    }

    if (data.Status === true) {
      return { success: true, message: "order-success", order };
    }

    return { success: false, message: "order-failed", ...data };
  }
}