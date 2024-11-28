import express from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';

const cartRouter = express.Router();

// Create Cart Details with Items
cartRouter.post('/', async (req: any, res: any) => {
  const { items, vendorId } = req.body;

  try {
    // Step 1: Create a new cart for the user
    const newCart = await prisma.cart.create({
      data: {
        userId: req.user.id,
        vendorId: vendorId,
      },
    });

    // Step 2: Add items to the newly created cart
    const createdItems = await Promise.all(
      items.map(async (item: any) => {
        return await prisma.cartItem.create({
          data: {
            cartId: newCart.id,
            externalProductId: item.externalProductId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            units: item.units,
            price: item.price,
            image: item.image,
          },
        });
      })
    );

    const createdCart = await prisma.cart.findUnique({
      where: { id: newCart.id },
      include: { items: true },
    });

    // Step 4: Return the response
    return res.status(201).json({
      message: 'Cart successfully created',
      cart: createdCart,
    })
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Fetch Cart Details
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
      const shipping = 10.0;
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

  // Fetch Cart Details
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