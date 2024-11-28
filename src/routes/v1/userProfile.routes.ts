import express from 'express';
import handleError from '../../helper/handleError';
import prisma from '../../config/prisma.config';

const profileRouter = express.Router();

// Create User Profile
profileRouter.post('/', async (req: any, res: any) => {
    try {
      const { name, email } = req.body;
  
      // Check if the user already has a profile
      const existingProfile = await prisma.userSetting.findMany({
        where: {
          userId: req.user.id,
          key: { in: ['name', 'email', 'phone'] },
        },
      });
  
      if (existingProfile.length > 0) {
        return res.status(400).json({ error: 'User profile already exists' });
      }
  
      // If no profile exists, create the new profile
      const data = [
        { key: 'name', value: name },
        { key: 'email', value: email },
      ];
  
      for (const item of data) {
        await prisma.userSetting.create({
          data: {
            userId: req.user.id,
            key: item.key,
            value: item.value,
          },
        });
      }
  
      res.status(201).json({ message: 'Settings created successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Update User Profile
  profileRouter.put('/', async (req: any, res: any) => {
    try {
      const { name, email } = req.body;
  
      const data = [
        { key: "name", value: name },
        { key: "email", value: email },
      ];
  
      // Use upsert to update existing settings or insert new ones if they don't exist
      for (const item of data) {
        await prisma.userSetting.upsert({
          where: {
            userId_key: {
              userId: req.user.id,
              key: item.key,
            },
          },
          update: {
            value: item.value,
          },
          create: {
            userId: req.user.id,
            key: item.key,
            value: item.value,
          },
        });
      }
  
      res.status(200).json({ message: 'Settings updated successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Fetch user profile
  profileRouter.get('/', async (req: any, res: any) => {
    try {
      const settings = await prisma.userSetting.findMany({
        where: { userId: req.user.id }
      });
  
      // Transform settings array into a key-value object
      const userProfile = settings.reduce((profile: any, setting: any) => {
        profile[setting.key] = setting.value;
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