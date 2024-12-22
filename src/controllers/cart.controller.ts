import { Body, Controller, Delete, Get, Post, Put, Request, Route, Security, Tags, Path } from "tsoa";
import createCart, { createCartItems, deleteCartbyId, fetchAllCart, fetchCartbyId, updatedCart } from "../services/cart";
import { CartItemsModelType, CartModelType } from "../types/database.types";
import TaskResult from "../types/ai.types";
import { _CartItemsModelType, _CartResponseType } from "../types/backwardCompatibility.types";
import { cartMapper } from "../helper/backwardMapper";

@Route("cart")
@Tags("Cart")
@Security("jwt")
export class CartController extends Controller {
    /**
     * Updates a cart with the specified cart ID.
     * @param req Incoming HTTP request containing cart details
     * @returns A cart model with updated values
     */
    @Put('/:cartId')
    public async updateCart(
        @Request() req: any, 
        @Path('cartId') cartId: string,
        @Body() body: { 
            updatedItems: _CartItemsModelType[] 
        }
    ): Promise<_CartResponseType> {
        try {
            const { updatedItems } = body;
            
            if(!cartId || !updatedItems){
                throw new Error('Missing or invalid inputs!')
            }

            const updateCart = await updatedCart(req.user.id, cartId, updatedItems)
            const returnCart = cartMapper(cartId, updateCart)
            return returnCart
        } catch (error: any){
            throw new Error(error.message)
        }
    }

    /**
     * Creates a new Cart from AI Microservice.
     * @param req Incoming HTTP request containing cart details.
     * @returns A cart model with created cart values.
     */
    @Post('/')
    public async createCart(
        @Request() req: any, 
        @Body() body: { 
            data: TaskResult, 
            combinedTotalSavedAmount: number, 
            combinedSubTotal: number, 
            total: number 
        }
    ): Promise<_CartResponseType> {
        try {
            const { data, combinedTotalSavedAmount, combinedSubTotal, total } = body;

            if(!data || !combinedTotalSavedAmount || !combinedSubTotal || !total){
                throw new Error('Missing or invalid inputs!')
            }

            const cart = await createCart(req.user.id, data, combinedTotalSavedAmount, combinedSubTotal, total)
            if(!cart || !cart.id){
                throw new Error('Cart creation unsuccessful! Try again!')
            }
            const returnCart = cartMapper(cart.id, cart)
            return returnCart
        } catch (error: any){
            throw new Error(error.message)
        }
    }

    /**
     * Create multiple cartItems for a specific cart with cartId
     * @param req Incoming HTTP request containing cartItems details.
     * @param body contains a list of CartItems and cartId
     * @returns A list of CartItems which are inserted
     */
    @Post('/:cartId/items')
    public async createCartItems(
        @Request() req: any, 
        @Path('cartId') cartId: string,
        @Body() body: {
            combinedCartItems: CartItemsModelType[],
        }
    ): Promise<CartItemsModelType[]> {
        try {
            const { combinedCartItems } = body;

            if(!combinedCartItems || !cartId){
                throw new Error('Missing or invalid inputs!')
            }

            const cart = await createCartItems(combinedCartItems, cartId.toString())
            return cart
        } catch (error: any){
            throw new Error(error.message)
        }
    }

    /**
     * Fetch multiple carts for a specific user
     * @param req Incoming HTTP request
     * @returns A list of Cart
     */
    @Get('/')
    public async getAllCarts(
        @Request() req: any
    ): Promise<_CartResponseType[]>{
        try {
            const carts = await fetchAllCart(req.user.id)
            const mappedCarts = carts.map((cart: CartModelType) => {
                if(!cart || !cart.id){
                    throw new Error('Carts fetch unsuccessful! Try again!')
                }
                return cartMapper(cart.id, cart)
            })
            return mappedCarts
        } catch (error: any){
            throw new Error(error.message)
        }
    }

    /**
     * Fetch specific carts using cartId for a specific user
     * @param req Incoming HTTP request
     * @param cartId incoming cartId
     * @returns A Cart model
     */
    @Get('/:cartId')
    public async getCartbyId(
        @Request() req: any,
        @Path('cartId') cartId: string,
    ): Promise<_CartResponseType>{
        try {
            const cart = await fetchCartbyId(cartId)
            if(!cart || !cart.id){
                throw new Error('Cart fetch unsuccessful! Try again!')
            }
            const returnCart = cartMapper(cart.id, cart)
            return returnCart
        } catch (error: any){
            throw new Error(error.message)
        }
    }

    /**
     * Delete a specific cart using cartId
     * @param req Incoming HTTP request
     * @returns A Cart model
     */
    @Delete('/:cartId')
    public async deleteCartbyId(
        @Path('cartId') cartId: string,
        @Request() req: any
    ): Promise<_CartResponseType>{
        try {
            const cart = await deleteCartbyId(cartId, req.user.Id)
            if(!cart || !cart.id){
                throw new Error('Cart delete unsuccessful! Try again!')
            }
            const returnCart = cartMapper(cart.id, cart)
            return returnCart
        } catch (error: any){
            throw new Error(error.message)
        }
    }
}