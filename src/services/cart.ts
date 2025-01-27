import { CouponCodeModel } from "@prisma/client";
import prisma from "../config/prisma.config";
import { cartDiscount, cartFreeDeliveryThreshold, deliveryCharges, deliveryTime } from "../constants";
import TaskResult from "../types/ai.types";
import { _CartItemsModelType } from "../types/backwardCompatibility.types";
import { CartItemsModelType, CartModelType, ExposedCouponModel } from "../types/database.types";
import { couponApplier } from "../helper/discountMapper";

/**
 * 
 * @param data 
 * @param combinedTotalSavedAmount 
 * @param combinedSubTotal 
 * @param total 
 * @returns 
 */
export async function createCart(userId: string, data: TaskResult, combinedTotalSavedAmount: number, combinedSubTotal: number, total: number): Promise<CartModelType> {
    try {
        const cart = await prisma.cartModel.create({
            data: {
                userId: userId,
                cartStoreId: data.result.storeData._id,
                cartaiStoreId: data.result.storeId,
                cartStoreName: data.result.storeData.storeName,
                cartStoreAddress: `${data.result.storeData.storeAddress.address1}, ${data.result.storeData.storeAddress.address2}, ${data.result.storeData.storeAddress.city}, ${data.result.storeData.storeAddress.state}, ${data.result.storeData.storeAddress.pincode}, IND`,
                cartDeliveryCharges: deliveryCharges,
                cartDeliverytime: deliveryTime,
                cartDiscount: cartDiscount,
                cartFreeDeliveryThreshold: cartFreeDeliveryThreshold,
                cartNote: `Your's truly, Kiranapro!`,
                cartSaved: combinedTotalSavedAmount,
                cartSavingsMessage:
                    combinedTotalSavedAmount === 0
                        ? "Add more items for more saving!"
                        : `You saved ₹${combinedTotalSavedAmount.toFixed(2)}!`,
                cartStoreContact: data.result.storeData.name,
                cartStorePhone: data.result.storeData.mobile,
                cartSubTotal: combinedSubTotal,
                cartTotal: total,
            }
        });

        return cart;
    } catch (error: any) {
        throw new Error(`Create cart failed! ${error.message}`)
    }
}

/**
 * 
 * @param combinedCartItems 
 * @param cartId 
 */
export async function createCartItems(combinedCartItems: CartItemsModelType[], cartId: string): Promise<CartItemsModelType[]> {
    try {
        const cartItems: CartItemsModelType[] = []
        if (combinedCartItems.length > 0) {
            await prisma.cartItemsModel.createMany({
                data: combinedCartItems.map((item) => ({
                    ...item,
                    itemQuantity: item.itemQuantity <= 3 ? item.itemQuantity : 3,
                    cartId: cartId,
                })),
            });

            // Retrieve the created cart items
            const createdItems = await prisma.cartItemsModel.findMany({
                where: {
                    cartId: cartId,
                },
            });

            cartItems.push(...createdItems);
        }
        return cartItems

    } catch (error: any) {
        throw new Error(`Create cartItems failed! ${error.message}`)
    }
}

/**
 * 
 * @param userId 
 * @param cartId 
 * @param updatedItems 
 * @returns 
 */
export async function updatedCart(userId: string, cartId: string, updatedItems: _CartItemsModelType[]): Promise<{updateCart: CartModelType, coupon: CouponCodeModel | null}> {
    try {
        // Fetch all existing cart items
        const existingCartItems = await prisma.cartItemsModel.findMany({
            where: { cartId },
        });

        // Determine which items should be removed
        const updatedExternalProductIds = updatedItems.map((item: _CartItemsModelType) => item.itemExternalId);
        const itemsToRemove = existingCartItems.filter(
            (existingItem) => !updatedExternalProductIds.includes(existingItem.itemExternalId)
        );

        // Remove items that are in the existing cart but not in the updated cart
        await Promise.all(
            itemsToRemove.map(async (item) => {
                await prisma.cartItemsModel.deleteMany({
                    where: { cartId, itemExternalId: item.itemExternalId },
                });
            })
        );

        // Iterate over the updated items to add or update them
        await Promise.all(
            updatedItems.map(async (item: _CartItemsModelType) => {
                const existingCartItem = existingCartItems.find(
                    (existingItem) => existingItem.itemExternalId === item.itemExternalId
                );

                if (item.itemQuantity <= 0) {
                    if (existingCartItem) {
                        // Remove the item from the cart if quantity is zero or less and it exists
                        await prisma.cartItemsModel.deleteMany({
                            where: { cartId, itemExternalId: item.itemExternalId },
                        });
                    }
                } else if (existingCartItem) {
                    // Update the quantity of the item if it exists
                    await prisma.cartItemsModel.updateMany({
                        where: { cartId, itemExternalId: item.itemExternalId },
                        data: {
                            itemQuantity: item.itemQuantity <= 3 ? item.itemQuantity : 3,
                            itemRecommended: false
                        },
                    });
                } else {
                    // Add the item to the cart if it does not exist
                    await prisma.cartItemsModel.create({
                        data: {
                            cartId,
                            itemExternalId: item.itemExternalId,
                            itemName: item.itemName,
                            itemDescription: item.itemDescription,
                            itemQuantity: item.itemQuantity <= 3 ? item.itemQuantity : 3,
                            itemWeight: item.itemWeight,
                            itemWeightUnit: item.itemWeightUnit,
                            itemOriginalPrice: item.itemOriginalPrice,
                            itemDiscountedPrice: item.itemDiscountedPrice,
                            itemImageUrl: item.itemImageUrl[0],
                            itemRecommended: false,
                            itemStockStatus: item.itemStockStatus
                        },
                    });
                }
            })
        );

        // Ensure the cart belongs to the user
        const existingCart = await prisma.cartModel.findUnique({
            where: { id: cartId, userId: userId },
            include: { cartItems: true, coupon: true },
        });

        if (!existingCart) {
            throw new Error('Cart not found! Try again')
        }

        // Calculate the subtotal based on the final cart items
        let subtotal = 0;
        existingCart.cartItems.forEach((item) => {
            subtotal += item.itemQuantity * item.itemDiscountedPrice;
        });

        // You can calculate 'total' here by adding any additional charges (e.g., taxes, shipping, etc.)
        const total = subtotal + deliveryCharges;

        const exposedCoupon = couponApplier(existingCart, existingCart.coupon)

        // Update the cart with the new subtotal and total
        await prisma.cartModel.update({
            where: { id: cartId },
            data: {
                cartSubTotal: subtotal,
                cartTotal: exposedCoupon.discountedTotal,
            },
            include: { cartItems: true },
        });

    } catch (error: any) {
        throw new Error(`Cart was not updated! ${error.message}`)
    }

    // Fetch the updated cart
    const updateCart = await prisma.cartModel.findUnique({
        where: { id: cartId },
        include: { cartItems: true, coupon: true },
    });

    if (!updateCart) {
        throw new Error('Cart was not updated! Try again')
    }

    // Reorder the cart items to match the order of updatedItems
    updateCart.cartItems = updatedItems
        .map((item) => updateCart.cartItems.find((cartItem) => cartItem.itemExternalId === item.itemExternalId))
        .filter((item): item is NonNullable<typeof item> => item !== undefined);

    return { updateCart, coupon: updateCart.coupon };
}

/**
 * 
 * @param cartId 
 * @returns 
 */
export async function fetchCartbyId(cartId: string): Promise<{responseCart: CartModelType, coupon: CouponCodeModel | null}> {
    const cart = await prisma.cartModel.findUnique({
        where: {
            id: cartId
        },
        include: {
            cartItems: true,
            coupon: true
        }
    });

    if (!cart) {
        throw new Error('Cart was not found! Try again')
    }
    return {responseCart: cart, coupon: cart.coupon}
}

/**
 * 
 * @param userId 
 * @returns 
 */
export async function fetchAllCart(userId: string): Promise<CartModelType[]> {
    const cart = await prisma.cartModel.findMany({
        where: {
            userId: userId
        },
        include: {
            cartItems: true
        }
    });

    if (!cart) {
        throw new Error('Cart(s) was not found! Try again')
    }
    return cart
}

export async function deleteCartbyId(cartId: string, userId: string): Promise<CartModelType> {
    const cart = await prisma.cartModel.delete({
        where: {
            id: cartId
        },
        include: {
            cartItems: true
        }
    });

    if (!cart) {
        throw new Error('Cart is not found! Try again')
    }
    return cart
}

export default createCart;