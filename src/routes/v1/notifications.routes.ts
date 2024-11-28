import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';

const notificationRouter = express.Router();

// Fetch all notifications for a user
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
  
  // Create notifications for a User
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
  
  // Delete Notification of a User
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