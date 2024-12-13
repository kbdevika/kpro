import express, { Request, Response } from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';

const cartRouter = express.Router();

type CartItems = {
  id: number;
  name: string;
  cartId: string;
  externalProductId: string;
  description: string;
  quantity: number;
  units: string;
  price: number;
  image: string;
}

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Create a new cart with items
 *     description: This endpoint allows users to create a new cart, add items to it, and return the created cart with items included.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *                 description: The ID of the vendor associated with the cart.
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     externalProductId:
 *                       type: string
 *                       description: The external product ID for the item.
 *                     name:
 *                       type: string
 *                       description: The name of the product.
 *                     description:
 *                       type: string
 *                       description: A description of the product.
 *                     quantity:
 *                       type: integer
 *                       description: The quantity of the product.
 *                     units:
 *                       type: string
 *                       description: The unit of the product (e.g., kg, piece, etc.).
 *                     price:
 *                       type: number
 *                       format: float
 *                       description: The price per unit of the product.
 *                     image:
 *                       type: string
 *                       description: The URL of the product image.
 *             required:
 *               - vendorId
 *               - items
 *     responses:
 *       201:
 *         description: Cart successfully created with items.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cart successfully created"
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "cart_123"
 *                     userId:
 *                       type: string
 *                       example: "user_123"
 *                     vendorId:
 *                       type: string
 *                       example: "vendor_123"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "item_123"
 *                           externalProductId:
 *                             type: string
 *                             example: "prod_456"
 *                           name:
 *                             type: string
 *                             example: "Sample Product"
 *                           description:
 *                             type: string
 *                             example: "A sample product description."
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           units:
 *                             type: string
 *                             example: "kg"
 *                           price:
 *                             type: number
 *                             format: float
 *                             example: 100.5
 *                           image:
 *                             type: string
 *                             example: "https://example.com/product-image.jpg"
 *       400:
 *         description: Bad Request - Invalid input or missing fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid input data"
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */

cartRouter.post('/', async (req: any, res: any) => {
  const { vendorId, items } = req.body;

  if (!vendorId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    // Create a new cart
    const cart = await prisma.cart.create({
      data: {
        userId: req.user.id,
        vendorId,
      },
    });

    // Add items to the cart
    const cartItems = items.map((item: any) => ({
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

    res.status(201).json({
      message: 'Cart successfully created',
      cart: createdCart,
    });
  } catch (error) {
    handleError(error, res);
  }
});
  
cartRouter.put('/', async (req: any, res: any) => {
  const { cartId, updatedItems } = req.body; // `updatedItems` is an array of items with new quantities

  try {
    // Ensure the cart belongs to the user
    const existingCart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true }, // Fetch current cart items
    });

    if (!existingCart || existingCart.userId !== req.user.id) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Iterate over the items to update them
    await Promise.all(
      updatedItems.map(async (item: { itemId: string; quantity: number }) => {
        const { itemId, quantity } = item;

        if (quantity <= 0) {
          // Remove the item from the cart if quantity is zero or less
          await prisma.cartItem.deleteMany({
            where: { cartId, externalProductId: itemId },
          });
        } else {
          // Update the quantity of the item if it exists
          await prisma.cartItem.updateMany({
            where: { cartId, externalProductId: itemId },
            data: { quantity },
          });
        }
      })
    );

    // Fetch the updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    return res.status(200).json({
      message: 'Cart successfully updated',
      cart: updatedCart,
    });
  } catch (error) {
    handleError(error, res);
  }
});
  
 /**
 * @swagger
 * /cart/{id}:
 *   get:
 *     summary: Get cart details
 *     description: Retrieve cart details, including items, subtotal, shipping, and total for the authenticated user.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cart to retrieve.
 *     responses:
 *       200:
 *         description: Cart details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "cart_123"
 *                 vendorId:
 *                   type: string
 *                   example: "vendor_123"
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "item_123"
 *                       name:
 *                         type: string
 *                         example: "Sample Item"
 *                       price:
 *                         type: number
 *                         example: 20.0
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                 subTotal:
 *                   type: number
 *                   example: 40.0
 *                 shipping:
 *                   type: number
 *                   example: 10.0
 *                 total:
 *                   type: number
 *                   example: 50.0
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Cart not found.
 *       500:
 *         description: Internal server error.
 */
  cartRouter.get('/:id', async (req: any, res: any) => {
    try {
      const cart = await prisma.cart.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: {
          items: true
        }
      });
  
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
  
      const subTotal = cart.items.reduce((sum: any, item: any) => 
        sum + (item.price * item.quantity), 0);
      const shipping = 35.0;
      const total = subTotal + shipping;
  
      res.json({
        id: cart.id,
        items: cart.items,
        subTotal,
        shipping,
        total
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
 * @swagger
 * /cart:
 *   get:
 *     summary: Fetch all carts for the authenticated user
 *     description: This endpoint allows users to retrieve all carts associated with their account, including the cart items.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched the cart details.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "cart_123"
 *                   userId:
 *                     type: string
 *                     example: "user_123"
 *                   vendorId:
 *                     type: string
 *                     example: "vendor_123"
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "item_123"
 *                         externalProductId:
 *                           type: string
 *                           example: "prod_456"
 *                         name:
 *                           type: string
 *                           example: "Sample Product"
 *                         description:
 *                           type: string
 *                           example: "A sample product description."
 *                         quantity:
 *                           type: integer
 *                           example: 2
 *                         units:
 *                           type: string
 *                           example: "kg"
 *                         price:
 *                           type: number
 *                           format: float
 *                           example: 100.5
 *                         image:
 *                           type: string
 *                           example: "https://example.com/product-image.jpg"
 *       404:
 *         description: Cart not found for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Cart not found"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */
  cartRouter.get('/', async (req: any, res: any) => {
    try {
      const cart = await prisma.cart.findMany({
        where: {
          userId: req.user.id
        },
        include: {
          items: true
        }
      });
  
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

  
      res.json(cart);
    } catch (error) {
      handleError(error, res);
    }
  });

export default cartRouter;