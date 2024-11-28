import express from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';

const homeRouter = express.Router();

homeRouter.get('/', async (req: any, res: any) => {
    try {
  
      type Banner = string;
  
      interface CarouselItem {
        id: string;
        image_url: string;
      }
  
      function createBanners(count: number): Banner[] {
        return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/picsum/200/300`);
      }
  
      function createCarousel(count: number): CarouselItem[] {
        return Array.from({ length: count }, (_, i) => ({
          id: (i + 1).toString(),
          image_url: `https://picsum.photos/200/300?grayscale`,
        }));
      }
  
      const banners = createBanners(5);
      const carousels = createCarousel(5);
  
      res.status(200).json({
        banner: banners,
        carousel: carousels
      })
    } 
    catch (error) {
      handleError(error, res);
    }
  });

export default homeRouter;