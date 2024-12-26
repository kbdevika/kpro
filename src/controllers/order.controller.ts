import { Controller, Get, Post, Path, Body, Route, Tags, Response, Security, Request } from "tsoa";
import prisma from "../config/prisma.config";
import orderToKikoOrder from "../helper/orderToKikoOrder";
import kikoUrl, { disabledActualOrder } from "../constants";
import { _OrderResponse } from "../types/backwardCompatibility.types";
import { orderMapper } from "../helper/backwardMapper";
import { OrderResponse } from "../types/database.types";

@Route("order")
@Tags("Orders")
@Security("jwt")
export class OrdersController extends Controller {
  /**
   * Fetch all orders for the logged-in user.
   * @returns A list of orders.
   */
  @Get("/")
  public async getOrders(@Request() req: any): Promise<{ orders: _OrderResponse[] }> {
    const _orders = await prisma.orderModel.findMany({
      where: { userId: req.user.id },
      orderBy: {
        createdDate: 'desc',
      },
      include: {
        cart: {
          include: {
            cartItems: true,
          },
        },
        address: true,
      },
    });

    const orders = _orders
      .map((order: OrderResponse) => orderMapper(order))
      .filter((order) => order !== null)

    if (orders && orders.length > 0) {
      return { orders };
    }

    throw new Error('Orders not found');
  }

  /**
   * Create a new order.
   * @param body The request body containing cartId and addressId.
   * @returns The created order.
   */
  @Post("/")
  @Response(404, "CartId and AddressId are required")
  public async createOrder(
    @Request() req: any,
    @Body() body: { cartId: string; addressId: string }
  ): Promise<{ message: string; order: _OrderResponse }> {
    const { cartId, addressId } = body;

    if (!cartId || !addressId) {
      this.setStatus(404);
      throw new Error("CartId and AddressId are required");
    }

    const { kikoOrder, order } = await orderToKikoOrder(cartId, req.user.id, addressId);

    const _ = orderMapper(order)

    if(_ == null){
      throw new Error('Order not found')
    }

    if (disabledActualOrder) {
      return { message: "Order to Kiko is disabled in development mode", order: _ };
    }

    const response = await fetch(`${kikoUrl}/kiranapro-create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kikoOrder),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      this.setStatus(response.status);
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.Status === false && data.outOfStock === true) {
      return { message: "out-of-stock", order: _ };
    }

    if (data.Status === true) {
      return { message: "created", order: _ };
    }

    return { message: "failed", ...data };
  }

  /**
   * Get a specific order by ID.
   * @param id The ID of the order to fetch.
   * @returns The order details.
   */
  @Get("/{id}")
  public async getOrder(@Request() req: any, @Path() id: string): Promise<_OrderResponse> {
    const order = await prisma.orderModel.findUnique({
      where: { id },
      include: { cart: {
        include: {
          cartItems: true
        }
      }, address: true },
    });

    if (!order) {
      this.setStatus(404);
      throw new Error("No orders found for this user");
    }

    if (order.userId !== req.user.id) {
      this.setStatus(403);
      throw new Error("Unauthorized user");
    }

    const _ = orderMapper(order)

    if(_ == null){
      throw new Error('Order not found')
    }

    return _;
  }

  /**
   * Get the tracking status of a specific order.
   * @param id The ID of the order to track.
   * @returns The order's tracking status.
   */
  @Get("/{id}/track")
  public async trackOrder(@Request() req: any, @Path() id: string): Promise<{ orderStatus: string; deliveryStatus: string }> {
    const order = await prisma.orderModel.findUnique({
      where: { id },
      include: { cart: {
        include: {
          cartItems: true
        }
      } },
    });

    if (!order) {
      this.setStatus(404);
      throw new Error("No orders found for this user");
    }

    if (order.userId !== req.user.id) {
      this.setStatus(401);
      throw new Error("Unauthorized user");
    }

    return { orderStatus: order.orderStatus, deliveryStatus: order.orderDeliveryStatus };
  }

  /**
   * Cancel an order.
   * @param id The ID of the order to cancel.
   * @returns A success message or an error.
   */
  @Post("/{id}/cancel")
  public async cancelOrder(@Request() req: any, @Path() id: string): Promise<{ message: string }> {
    const order = await prisma.orderModel.findFirst({
      where: { id },
      include: { cart: true },
    });

    if (!order) {
      this.setStatus(404);
      throw new Error("Order not found");
    }

    if (order.userId !== req.user.id) {
      this.setStatus(403);
      throw new Error("You are not authorized to cancel this order");
    }

    if (order.orderStatus === "completed") {
      this.setStatus(400);
      throw new Error("Order is delivered");
    }

    const response = await fetch(`${kikoUrl}/kiranapro-cancel-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kiranaProOrderId: id }),
    });

    if (!response.ok) {
      this.setStatus(response.status);
      throw new Error("Failed to cancel the order");
    }

    return { message: "Order cancelled successfully" };
  }
}