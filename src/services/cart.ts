import prisma from "../config/prisma.config";
import fetchJwtToken from "../helper/fetchAiJwtToken";
import Product, { AICartResponse, CartResponse } from "../types/cart.type";

/**
 * Cart Services:
 *      - Create cart with items, vendorId
 *      - Update cart with quantities, new items and delete item if any
 *      - Delete cart on Order
 */

const createCart = async (userId: string, vendorId: string, items: Product[]): Promise<AICartResponse> => {

    // Create a new cart
    const cart = await prisma.cart.create({
        data: {
        userId: userId,
        vendorId,
        },
    });

    // Add items to the cart
    const cartItems = items.map((item: Product) => ({
        cartId: cart.id,
        externalProductId: item.externalProductId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        units: item.units,
        price: item.price,
        image: item.image,
    }));

    await prisma.cartItem.createMany({
        data: cartItems,
    });

    // Fetch the created cart with items
    const createdCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
        items: true,
        },
    });

    if(!createdCart){
        throw new Error('Cart was not created! Try again') 
    }

    return createdCart;
}

const updatedCart = async (userId: string, cartId: string, updatedItems: Product[]): Promise<AICartResponse> => {
    // Ensure the cart belongs to the user
    const existingCart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: true },
    });

    if (!existingCart || existingCart.userId !== userId) {
        throw new Error('Cart not found! Try again')
    }

    try {
        // Fetch all existing cart items
        const existingCartItems = await prisma.cartItem.findMany({
            where: { cartId },
        });
        
        // Determine which items should be removed
        const updatedExternalProductIds = updatedItems.map((item: Product) => item.externalProductId);
        const itemsToRemove = existingCartItems.filter(
            (existingItem) => !updatedExternalProductIds.includes(existingItem.externalProductId)
        );
        
        // Remove items that are in the existing cart but not in the updated cart
        await Promise.all(
            itemsToRemove.map(async (item) => {
            await prisma.cartItem.deleteMany({
                where: { cartId, externalProductId: item.externalProductId },
            });
            })
        );
        
        // Iterate over the updated items to add or update them
        await Promise.all(
            updatedItems.map(async (item: Product) => {
            const existingCartItem = existingCartItems.find(
                (existingItem) => existingItem.externalProductId === item.externalProductId
            );
        
            if (item.quantity <= 0) {
                if (existingCartItem) {
                // Remove the item from the cart if quantity is zero or less and it exists
                await prisma.cartItem.deleteMany({
                    where: { cartId, externalProductId: item.externalProductId },
                });
                }
            } else if (existingCartItem) {
                // Update the quantity of the item if it exists
                await prisma.cartItem.updateMany({
                where: { cartId, externalProductId: item.externalProductId },
                data: { quantity: item.quantity },
                });
            } else {
                // Add the item to the cart if it does not exist
                await prisma.cartItem.create({
                data: {
                    cartId,
                    externalProductId: item.externalProductId,
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    units: item.units,
                    price: item.price,
                    image: item.image,
                },
                });
            }
            })
        );
        
    } catch (error: any){
        throw new Error(`Cart was not updated! ${error.message}`)
    }

    // Fetch the updated cart
    const updatedCart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: true },
    });

    if(!updatedCart){
        throw new Error('Cart was not updated! Try again')
    }

    return updatedCart;
}

const fetchCart = async (cartId: string, userId: string): Promise<AICartResponse> => {
    const cart = await prisma.cart.findFirst({
        where: {
          id: cartId,
          userId: userId
        },
        include: {
          items: true
        }
      });

    if(!cart){
        throw new Error('Cart was not updated! Try again')
    }
    return cart
}

export {
    updatedCart,
    fetchCart
}
export default createCart;