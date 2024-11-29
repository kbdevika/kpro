import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';

const userSettingsRouter = express.Router();

/**
 * @swagger
 * /user/settings:
 *   get:
 *     summary: Get user settings
 *     description: Retrieve all settings for the authenticated user.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user settings.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "1"
 *                   userId:
 *                     type: string
 *                     example: "user_123"
 *                   key:
 *                     type: string
 *                     example: "name"
 *                   value:
 *                     type: string
 *                     example: "Jon Doe"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
userSettingsRouter.get('/', async (req: any, res) => {
    try {
      const settings = await prisma.userSetting.findMany({
        where: { userId: req.user.id }
      });
      res.json(settings);
    } catch (error) {
      handleError(error, res);
    }
  });
  
/**
 * @swagger
 * /user/settings:
 *   post:
 *     summary: Create a new user setting
 *     description: Add a new setting for the authenticated user.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 example: "theme"
 *               value:
 *                 type: string
 *                 example: "dark"
 *     responses:
 *       200:
 *         description: Setting created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting created successfully"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */
  userSettingsRouter.post('/', async (req: any, res) => {
    try {
      const { key, value } = req.body;
      await prisma.userSetting.create({
        data: {
          userId: req.user.id,
          key,
          value
        }
      });
      res.json({ message: 'Setting created successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });
  
/**
 * @swagger
 * /user/settings/{key}:
 *   put:
 *     summary: Update an existing user setting
 *     description: Update a setting for the authenticated user based on the key.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The key of the setting to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: "light"
 *     responses:
 *       200:
 *         description: Setting updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting updated successfully"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Setting not found.
 *       500:
 *         description: Internal server error.
 */
  userSettingsRouter.put('/:key', async (req: any, res: any) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const updated = await prisma.userSetting.updateMany({
        where: {
          userId: req.user.id,
          key
        },
        data: { value }
      });
  
      if (updated.count === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }
  
      res.json({ message: 'Setting updated successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });
  
/**
 * @swagger
 * /user/settings/{key}:
 *   delete:
 *     summary: Delete a user setting
 *     description: Delete a specific setting for the authenticated user based on the key.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The key of the setting to delete.
 *     responses:
 *       200:
 *         description: Setting deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting deleted successfully"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Setting not found.
 *       500:
 *         description: Internal server error.
 */
  userSettingsRouter.delete('/:key', async (req: any, res: any) => {
    try {
      const { key } = req.params;
      
      const deleted = await prisma.userSetting.deleteMany({
        where: {
          userId: req.user.id,
          key
        }
      });
  
      if (deleted.count === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }
  
      res.json({ message: 'Setting deleted successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });

export default userSettingsRouter;