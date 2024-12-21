import { Controller, Get, Post, Route, Tags, Path, Body, Query, Response, Security, Request } from "tsoa";
import fetchJwtToken from "../helper/fetchAiJwtToken";
import convertToCart from "../helper/convertToCart";
import validateHeaders from "../helper/validateHeader";
import getPincodeFromCoordinates from "../helper/convertLatLongToPincode";
import prisma from "../config/prisma.config";

interface SearchRequest {
  query: string;
  aiStoreId: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

@Route("ai")
@Tags("AI")
@Security("jwt")
export class AIController extends Controller {
  /**
   * Fetches the cart status or details based on task ID.
   * @param taskId The unique task ID.
   * @returns The cart status or cart details.
   */
  @Get("/{taskId}")
  @Response(400, "Task ID missing!")
  public async getCartStatus(@Path() taskId: string, @Request() req: any): Promise<any> {
    if (!taskId) {
      this.setStatus(400);
      throw new Error("Task ID missing!");
    }

    const task = await prisma.taskModel.findUnique({
      where: { taskExternalId: taskId, userId: req.user.id },
    });

    if (!task || task.taskStatus !== "success") {
      const jwtToken = await fetchJwtToken();
      const response = await fetch(`https://dev-ai-api.kpro42.com/api/cart/enrich/${taskId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      if (!response.ok) {
        this.setStatus(response.status);
        throw new Error(`Error occurred while fetching AI response: ${await response.text()}`);
      }

      const data = await response.json();
      if (data.state === "failed") {
        return { cartStatus: "failed" };
      }

      if (data.result === null && data.state === "active") {
        return { cartStatus: "in-progress" };
      }

      const cart = await convertToCart(data, taskId, req.user.id);
      if (cart) return { cartStatus: "success", cart };

      this.setStatus(400);
      throw new Error("Something went wrong! Try again.");
    }

    const cart = await prisma.cartModel.findUnique({
      where: { id: task.cartId },
      include: { cartItems: true },
    });

    if (cart) return { cartStatus: "success", cart };

    this.setStatus(400);
    throw new Error("Something went wrong! Try again.");
  }

  /**
   * Searches for items based on a query and AI store ID.
   * @param body The search request containing the query and AI store ID.
   * @returns The search results.
   */
  @Post("/search")
  @Response(400, "Missing or invalid inputs!")
  public async searchItems(@Body() body: SearchRequest): Promise<any> {
    const { query, aiStoreId } = body;

    if (!query || !aiStoreId) {
      this.setStatus(400);
      throw new Error("Missing or invalid inputs!");
    }

    const filters = `storeId="${aiStoreId}"`;
    const jwtToken = await fetchJwtToken();
    const response = await fetch(
      `https://dev-ai-api.kpro42.com/api/item/search?q=${query}&filters=${encodeURIComponent(filters)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );

    if (!response.ok) {
      this.setStatus(response.status);
      throw new Error(`Error occurred while fetching AI response: ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * Retrieves the pincode from the User-Agent header.
   * @param userAgent The User-Agent header.
   * @returns Whether stores are available in the pincode.
   */
  @Get("/")
  @Response(400, "Missing or invalid User-Agent header.")
  public async getPincodeAvailability(@Query("userAgent") userAgent: string): Promise<{ pincode: boolean }> {
    const coordinates = validateHeaders(userAgent);
    if (!coordinates) {
      this.setStatus(400);
      throw new Error("Missing or invalid User-Agent header.");
    }

    const { latitude, longitude } = coordinates;
    const pincode = await getPincodeFromCoordinates(latitude, longitude);
    if (!pincode) {
      this.setStatus(400);
      throw new Error("Pincode missing!");
    }

    const jwtToken = await fetchJwtToken();
    const response = await fetch(`https://dev-ai-api.kpro42.com/api/stores/${pincode}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (!response.ok) {
      this.setStatus(response.status);
      throw new Error(`Error occurred while fetching AI response: ${await response.text()}`);
    }

    const data = await response.json();
    return { pincode: data.stores.length > 0 };
  }
}