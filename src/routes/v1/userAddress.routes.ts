import express from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';

const userAddressRouter = express.Router()

// Fetch User Address
userAddressRouter.get('/', async (req: any, res: any) => {
    try {
      const addresses = await prisma.address.findMany({
        where: { userId: req.user.id }
      });
      res.json(addresses);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Create User Address
  userAddressRouter.post('/', async (req: any, res: any) => {
    try {
      const { address_line1, address_line2, street, city, state, country,latitude, longitude, addressType, landmark, postalCode } = req.body;
      const address = await prisma.address.create({
        data: {
          userId: req.user.id,
          address_line1,
          address_line2,
          street,
          city,
          state,
          country,
          latitude,
          longitude,
          addressType,
          landmark,
          postalCode
        }
      });
      res.json({ message: 'Address created successfully', id: address.id });
    } catch (error) {
      handleError(error, res);
    }
  });

export default userAddressRouter;