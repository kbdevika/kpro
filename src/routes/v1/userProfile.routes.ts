import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';

const profileRouter = express.Router();

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create user settings as key-value pairs
 *     description: Creates user settings such as name, email, and phone as individual key-value pairs in the database. If the user already has a profile, an error is returned.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *             required:
 *               - name
 *               - email
 *     responses:
 *       201:
 *         description: User settings created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Settings created successfully
 *       400:
 *         description: Bad Request - User profile already exists or invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User profile already exists
 *       401:
 *         description: Unauthorized - Token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
  profileRouter.post('/', async (req: any, res: any) => {
    try {
      const { name, email } = req.body;
  
      const data = [
        { key: "name", value: name },
        { key: "email", value: email },
      ];
  
      // Use upsert to update existing settings or insert new ones if they don't exist
      for (const item of data) {
        await prisma.userSettingsModel.upsert({
          where: {
            userId_settingsKey: {
              userId: req.user.id,
              settingsKey: item.key,
            },
          },
          update: {
            settingsValue: item.value,
          },
          create: {
            userId: req.user.id,
            settingsKey: item.key,
            settingsValue: item.value,
          },
        });
      }

      const settings = await prisma.userSettingsModel.findMany({
        where: { userId: req.user.id }
      });
  
      // Transform settings array into a key-value object
      const userProfile = settings.reduce((profile: any, setting: any) => {
        profile[setting.settingsKey] = setting.settingsValue;
        return profile;
      }, {});
  
      const filteredProfile = {
        id: req.user.id,
        name: userProfile['name'] || '',
        email: userProfile['email'] || '',
        phone: userProfile['phone'] || '',
      };
  
      res.status(200).json({ message: 'Settings updated successfully', updatedProfile: filteredProfile });
    } catch (error) {
      handleError(error, res);
    }
  });
  
/**
 * @swagger
 * /user:
 *   get:
 *     summary: Fetch user profile
 *     description: Retrieves user profile information such as name, email, and phone in a structured format.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: user_123
 *                 name:
 *                   type: string
 *                   example: user
 *                 email:
 *                   type: string
 *                   example: user@website.com
 *                 phone:
 *                   type: string
 *                   example: +919999999999
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
  profileRouter.get('/', async (req: any, res: any) => {
    try {
      const settings = await prisma.userSettingsModel.findMany({
        where: { userId: req.user.id }
      });
  
      // Transform settings array into a key-value object
      const userProfile = settings.reduce((profile: any, setting: any) => {
        profile[setting.settingsKey] = setting.settingsValue;
        return profile;
      }, {});
  
      const filteredProfile = {
        id: req.user.id,
        name: userProfile['name'] || '',
        email: userProfile['email'] || '',
        phone: userProfile['phone'] || '',
      };
  
      res.status(200).json(filteredProfile);
    } catch (error) {
      handleError(error, res);
    }
  });

export default profileRouter;