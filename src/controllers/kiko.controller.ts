import { Controller, Post, Route, Tags, Body, Response } from "tsoa";
import prisma from "../config/prisma.config";

interface UpdateOrderResponse {
  message: string;
  orderId: string;
  orderStatus: string;
  deliveryStatus: string;
}

interface UpdateOrderRequest {
  apiKey: string;
  orderId: string;
  orderStatus: string;
  deliveryStatus: string;
  endOTP: string;
  trackingURL: string;
  riderName: string;
  riderPhone: string;
}

@Route("kikoOrderStatus")
@Tags("Kiko")
export class KikoController extends Controller {
  /**
   * Updates the status of an order.
   * @param request UpdateOrderRequest object containing the API key, order ID, order status, and delivery status.
   * @returns A success message with updated order details.
   */
  @Post("/")
  @Response<UpdateOrderResponse>(200, "Order updated successfully")
  @Response(400, "Validation error")
  @Response(401, "Unauthorized")
  public async updateOrder(
    @Body() request: UpdateOrderRequest
  ): Promise<UpdateOrderResponse> {
    const validApiKey = process.env.KIKO_APIKEY || "7e563319-978e-5588-9474-5c0b8e767768";

    if (request.apiKey !== validApiKey) {
      this.setStatus(401);
      throw new Error("Unauthorized request");
    }

    const { orderId, orderStatus, deliveryStatus, endOTP, trackingURL, riderName, riderPhone  } = request;

    if (!orderId || !orderStatus || !deliveryStatus) {
      this.setStatus(400);
      throw new Error("Order ID, orderStatus, and deliveryStatus are required");
    }

    const normalizedOrderStatus = orderStatus.toLowerCase();
    const normalizedDeliveryStatus = deliveryStatus.toLowerCase();

    try {
      const updatedOrder = await prisma.orderModel.update({
        where: { id: orderId },
        data: {
          orderStatus: normalizedOrderStatus,
          orderDeliveryStatus: normalizedDeliveryStatus,
          endOTP,
          trackingURL,
          riderName,
          riderPhone
        },
      });

      return {
        message: "success",
        orderId: updatedOrder.id,
        orderStatus: normalizedOrderStatus,
        deliveryStatus: normalizedDeliveryStatus,
      };
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
}
