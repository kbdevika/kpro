import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';

const userSettingsRouter = express.Router();

// User Settings Routes
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
  
  // Create User Settings
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
  
  // Update User Settings
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
  
  // Delete User Settings
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