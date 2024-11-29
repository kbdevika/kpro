import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';

const notificationRouter = express.Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications
 *     description: Retrieve a list of all notifications.
 *     tags:
 *       - Notification
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the notification.
 *                   message:
 *                     type: string
 *                     description: The message content of the notification.
 *                   media_url:
 *                     type: string
 *                     description: URL to the media associated with the notification (if any).
 *                   created_date:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the notification was created.
 *       500:
 *         description: Server error or issue retrieving notifications.
 */
notificationRouter.get('/', async (req: any, res: any) => {
    try {
      const notifications = await prisma.notification.findMany({
        orderBy: {
          createdDate: 'desc', // Sort notifications by creation time (latest first)
        },
      });
  
      if (notifications.length === 0) {
        return res.status(404).json({ error: 'No notifications found' });
      }
  
      res.json({ notifications });
    } catch (error) {
      handleError(error, res);
    }
  });
  
 /**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Add a new notification
 *     description: Creates a new notification in the system.
 *     tags:
 *       - Notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content of the notification.
 *               media_url:
 *                 type: string
 *                 description: Optional URL for media associated with the notification.
 *     responses:
 *       201:
 *         description: Successfully added the notification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier of the created notification.
 *                     message:
 *                       type: string
 *                       description: The content of the notification.
 *                     media_url:
 *                       type: string
 *                       description: URL to the media associated with the notification.
 *                     created_date:
 *                       type: string
 *                       format: date-time
 *                       description: The date and time when the notification was created.
 *       400:
 *         description: Invalid request body (e.g., missing message).
 *       500:
 *         description: Internal server error.
 */
  notificationRouter.post('/', async (req: any, res: any) => {
    try {
      const { message, media_url } = req.body;
  
      // Validate input
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
  
      // Create a new notification
      const newNotification = await prisma.notification.create({
        data: {
          message: message,
          mediaUrl: media_url || '',  // Optional field
        },
      });
  
      res.status(201).json({
        message: 'Notification added successfully',
        notification: newNotification,
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification by ID
 *     description: Deletes a specific notification by its unique ID.
 *     tags:
 *       - Notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the notification to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted the notification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message indicating that the notification has been deleted.
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID of the deleted notification.
 *                     message:
 *                       type: string
 *                       description: The content of the deleted notification.
 *                     media_url:
 *                       type: string
 *                       description: URL to the media associated with the deleted notification.
 *                     created_date:
 *                       type: string
 *                       format: date-time
 *                       description: The date and time when the notification was created.
 *       404:
 *         description: Notification not found for the specified ID.
 *       500:
 *         description: Internal server error.
 */

  notificationRouter.delete('/:id', async (req: any, res: any) => {
    const notificationId = req.params.id;
  
    try {
      // Find and delete the notification with the provided ID
      const deletedNotification = await prisma.notification.delete({
        where: {
          id: notificationId,
        },
      });
  
      res.status(200).json({
        message: 'Notification deleted successfully',
        notification: deletedNotification,
      });
    } catch (error) {
      handleError(error, res);
    }
  });

export default notificationRouter;