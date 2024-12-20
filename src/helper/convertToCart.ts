import { CartModel } from "@prisma/client";
import { deliveryCharges } from "../constants";
import TaskResult, { Items } from "../types/ai.types";
import mapCartItems from "./aiToCartMapper";
import createCart, { createCartItems, fetchCart } from "../services/cart";
import { createTask } from "../services/task";
import { createNotification } from "../services/notification";

// Modify mapCartItems to return items only
export default async function convertToCart(data: TaskResult, taskId: string, userId: string): Promise<CartModel | null> {
  try {
    // Process items and recommendations
    let combinedSubTotal = 0;
    let combinedTotalSavedAmount = 0;

    // Mapping CartItems of Matching Items from AI Response
    const { cartItems, subTotal, totalSavedAmount } = mapCartItems(data.result.items, false, (item) => [item.metadata?.matching]);
    console.log(subTotal);
    
    // Mapping CartItems of Recommended Items from AI Response
    const { cartItems: recommendedItems, subTotal: recommendedSubTotal, totalSavedAmount: recommendedSaved } = mapCartItems(data.result.items, true, (item) => item.metadata?.recommendations || []);


    // Calculating subTotal of Original Items only
    combinedSubTotal += subTotal;
    combinedTotalSavedAmount += totalSavedAmount;
    

    // Combining both Matching and Recommended CartItems
    const combinedCartItems = [...cartItems, ...recommendedItems];
    const total = combinedSubTotal + deliveryCharges;

    // Creating a cart with details 
    const cart = await createCart(data, combinedTotalSavedAmount, combinedSubTotal, total);
    await createCartItems(combinedCartItems, cart.id);
    await createTask(taskId, cart.id, userId);
    await createNotification(userId);
    const responseCart = await fetchCart(cart.id);

    return responseCart
  } catch(error: any){
    throw new Error(`Something went wrong in creating cart! ${error.message}`)
  }
}
