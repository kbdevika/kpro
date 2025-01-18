import { Controller, Get, Post, Route, Tags, Path, Body, Query, Response, Security, Request } from "tsoa";
import fetchJwtToken from "../helper/fetchAiJwtToken";
import convertToCart from "../helper/convertToCart";
import validateHeaders from "../helper/validateHeader";
import getPincodeFromCoordinates from "../helper/convertLatLongToPincode";
import prisma from "../config/prisma.config";
import { _CartReponseItem, _CartResponseType } from "../types/backwardCompatibility.types";
import { cartMapper } from "../helper/backwardMapper";
import { searchProductMapper } from "../helper/productSearchMapper";
import { CartItemsModelType } from "../types/database.types";
import { AI_BASE_URL } from "../constants";

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
  public async getCartStatus(@Path() taskId: string, @Request() req: any): Promise<{ cartStatus: string, error?: string, cart?: _CartResponseType }> {
    try {
      if (!taskId) {
        this.setStatus(400);
        return { cartStatus: 'error', error: "Task ID missing!" };
      }

      if (!req.user || !req.user.id) {
        this.setStatus(401); // Unauthorized
        return { cartStatus: 'error', error: "User not authenticated or user ID missing!" };
      }

      const task = await prisma.taskModel.findUnique({
        where: { taskExternalId: taskId, userId: req.user.id },
      });

      if (!task || task.taskStatus !== "success") {
        const jwtToken = await fetchJwtToken();

        const response = await fetch(`${AI_BASE_URL}/api/task/${taskId}?type=cart-enrichment`, {
          method: "GET",
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        if (!response.ok) {
          this.setStatus(response.status);
          const errorText = await response.text();
          return { cartStatus: 'error', error: `Error occurred while fetching AI response: ${errorText}` };
        }

        const data = await response.json();
        if (data.state === "failed") {
          return { cartStatus: "failed" };
        }

        if (data.result === null && data.state === "active") {
          return { cartStatus: "in-progress" };
        }

        const cart = await convertToCart(data, taskId, req.user.id);
        if (cart) {
          return { cartStatus: "success", cart };
        }

        this.setStatus(400);
        return { cartStatus: 'error', error: "Something went wrong while converting to cart! Try again." };
      }

      const _cart = await prisma.cartModel.findUnique({
        where: { id: task.cartId },
        include: { cartItems: true },
      });

      if (_cart) {
        const cart = cartMapper(_cart.id, _cart)
        return { cartStatus: "success", cart };
      }

      this.setStatus(400);
      return { cartStatus: 'error', error: "Cart not found. Something went wrong!" };

    } catch (error: any) {
      this.setStatus(500);
      return { cartStatus: 'error', error: "Internal server error. Please try again later." + error.message };
    }
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
    const response = await fetch(`${AI_BASE_URL}/api/catalog/stores/pincode/${pincode}`, {
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