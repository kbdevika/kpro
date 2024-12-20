import express from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';
import isValidInt, { isValidFloat } from '../../helper/validations';

const userAddressRouter = express.Router()

/**
 * @swagger
 * /user/address:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     description: Retrieves a list of all addresses associated with the authenticated user.
 *     tags:
 *       - User Address
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     responses:
 *       200:
 *         description: Successfully retrieved user addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique ID of the address.
 *                     example: "c1234567-89ab-cdef-0123-456789abcdef"
 *                   userId:
 *                     type: string
 *                     description: The ID of the user who owns the address.
 *                     example: "u1234567-89ab-cdef-0123-456789abcdef"
 *                   address_line1:
 *                     type: string
 *                     description: The first line of the address.
 *                     example: "123 Main Street"
 *                   address_line2:
 *                     type: string
 *                     description: The second line of the address (optional).
 *                     example: "Apartment 4B"
 *                   street:
 *                     type: string
 *                     description: The street name.
 *                     example: "Central Park Road"
 *                   city:
 *                     type: string
 *                     description: The city name.
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     description: The state name.
 *                     example: "NY"
 *                   country:
 *                     type: string
 *                     description: The country name.
 *                     example: "USA"
 *                   latitude:
 *                     type: number
 *                     description: The latitude of the address (optional).
 *                     example: 40.712776
 *                   longitude:
 *                     type: number
 *                     description: The longitude of the address (optional).
 *                     example: -74.005974
 *                   addressType:
 *                     type: string
 *                     description: The type of address (e.g., home, work).
 *                     example: "home"
 *                   landmark:
 *                     type: string
 *                     description: A nearby landmark (optional).
 *                     example: "Near Central Park"
 *                   postalCode:
 *                     type: string
 *                     description: The postal or ZIP code.
 *                     example: "10001"
 *       401:
 *         description: Unauthorized - Token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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
  
  /**
 * @swagger
 * /user/address/{id}:
 *   get:
 *     summary: Get a unique address by ID
 *     description: This endpoint retrieves a specific address using its unique ID.
 *     tags:
 *       - User Address
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the address to retrieve.
 *     responses:
 *       200:
 *         description: Address retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: address_12345
 *                 userId:
 *                   type: string
 *                   example: user_67890
 *                 street:
 *                   type: string
 *                   example: "123 Main St"
 *                 city:
 *                   type: string
 *                   example: "Sample City"
 *                 state:
 *                   type: string
 *                   example: "CA"
 *                 zipCode:
 *                   type: string
 *                   example: "12345"
 *       404:
 *         description: Address not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Address not found"
 *       500:
 *         description: Internal Server Error - An unexpected error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */
  userAddressRouter.get('/:id', async (req: any, res: any) => {
    try {
      const address = await prisma.address.findUnique({
        where: { id: req.params.id }
      });
  
      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }
  
      res.json(address);
    } catch (error) {
      handleError(error, res);
    }
  });
  
 /**
 * @swagger
 * /user/address/{id}:
 *   delete:
 *     summary: Delete a unique address by ID
 *     description: This endpoint deletes a specific address using its unique ID.
 *     tags:
 *       - User Address
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the address to retrieve.
 *     responses:
 *       200:
 *         description: Address deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: address_12345
 *                 userId:
 *                   type: string
 *                   example: user_67890
 *                 street:
 *                   type: string
 *                   example: "123 Main St"
 *                 city:
 *                   type: string
 *                   example: "Sample City"
 *                 state:
 *                   type: string
 *                   example: "CA"
 *                 zipCode:
 *                   type: string
 *                   example: "12345"
 *       404:
 *         description: Address not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Address not found"
 *       500:
 *         description: Internal Server Error - An unexpected error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */
 userAddressRouter.delete('/:id', async (req: any, res: any) => {
  try {
    const address = await prisma.userAddressModel.delete({
      where: { 
        id: req.params.id,
        userId: req.user.id
       }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({message: 'Address deleted successfully', address: address});
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /user/address:
 *   post:
 *     summary: Create a new address for the user
 *     description: Adds a new address to the user's profile, including detailed information like location coordinates and address type.
 *     tags:
 *       - User Address
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address_line1:
 *                 type: string
 *                 description: The first line of the address.
 *                 example: "123 Main Street"
 *               address_line2:
 *                 type: string
 *                 description: The second line of the address (optional).
 *                 example: "Apartment 4B"
 *               street:
 *                 type: string
 *                 description: The street name.
 *                 example: "Central Park Road"
 *               city:
 *                 type: string
 *                 description: The city name.
 *                 example: "New York"
 *               state:
 *                 type: string
 *                 description: The state name.
 *                 example: "NY"
 *               country:
 *                 type: string
 *                 description: The country name.
 *                 example: "USA"
 *               latitude:
 *                 type: number
 *                 description: The latitude of the address (optional).
 *                 example: 40.712776
 *               longitude:
 *                 type: number
 *                 description: The longitude of the address (optional).
 *                 example: -74.005974
 *               addressType:
 *                 type: string
 *                 description: The type of address (e.g., home, work).
 *                 example: "home"
 *               landmark:
 *                 type: string
 *                 description: A nearby landmark (optional).
 *                 example: "Near Central Park"
 *               postalCode:
 *                 type: string
 *                 description: The postal or ZIP code.
 *                 example: "10001"
 *             required:
 *               - address_line1
 *               - city
 *               - state
 *               - country
 *               - postalCode
 * 
 *     responses:
 *       200:
 *         description: Address created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Address created successfully"
 *                 id:
 *                   type: string
 *                   description: The unique ID of the newly created address.
 *                   example: "c1234567-89ab-cdef-0123-456789abcdef"
 *       400:
 *         description: Bad Request - Missing or invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
  userAddressRouter.post('/', async (req: any, res: any) => {
    try {
      const { address_line1, address_line2, street, city, state, country, latitude, longitude, addressType, landmark, postalCode } = req.body;

      if (
        !address_line1 ||
        !state ||
        !city ||
        !isValidFloat(latitude) ||
        !isValidFloat(longitude) ||
        !isValidInt(postalCode)
      ){
        return res.status(400).json({ error: 'Missing or invalid inputs'})
      }

      const settings = await prisma.userSettingsModel.findMany({
        where: {
          userId: req.user.id,
          settingsKey: {
            in: ['phone', 'name'],
          },
        },
      });
      
      const phone = settings.find((setting) => setting.settingsKey === 'phone');
      const name = settings.find((setting) => setting.settingsKey === 'name');
      
      // Check if either phone or name is missing
      if (!phone) {
        return res.status(400).json({ error: 'Missing phone number in profile!' });
      }

      const address = await prisma.userAddressModel.create({
        data: {
          userId: req.user.id,
          addressLine1: address_line1,
          addressLine2: address_line2,
          addressStreet: street,
          addressCity: city,
          addressState: state,
          addressCountry: country,
          addressLatitude: latitude,
          addressLongitude: longitude,
          addressAddressType: addressType,
          addressLandmark: landmark,
          addressPostalCode: postalCode,
          addressContactName: name ? name.settingsValue : `trendsetter`,
          addressContactPhone: phone.settingsValue,
        }
      });
      res.json({ message: 'Address created successfully', address: address });
    } catch (error) {
      handleError(error, res);
    }
  });

export default userAddressRouter;