import express from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';

const homeRouter = express.Router();

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Get the home page data
 *     description: Returns a welcome message, banners, and carousels for the home page.
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: Home page data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 welcomeText:
 *                   type: string
 *                   example: "Hi, trendsetter"
 *                 welcomeSubText:
 *                   type: string
 *                   example: "Here are some things that you can ask!"
 *                 banners:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           image_url:
 *                             type: string
 *                             format: uri
 *                             example: "https://placehold.co/240x320"
 *                           deeplink:
 *                             type: string
 *                             example: ""
 *                     title:
 *                       type: string
 *                       example: "Sample"
 *                 carousels:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "1"
 *                           image_url:
 *                             type: string
 *                             format: uri
 *                             example: "https://placehold.co/240x320"
 *                           deeplink:
 *                             type: string
 *                             example: ""
 *                     title:
 *                       type: string
 *                       example: "To Create your cart, try saying,"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */
homeRouter.get('/', async (req: any, res: any) => {
    try {

      const welcomeText = `Hi, ${req.user.name || 'trendsetter'}`
      const welcomeSubText = 'Here are some things that you can ask!'

      const banners = {
        data :[
          {
            id: '1',
            image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/banner-1.png?alt=media&token=3c030890-91e2-4d14-8f28-1a8dfd11ab80",
            deeplink: ''
          },
          {
            id: '2',
            image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/banner-2.png?alt=media&token=74b70df1-2f33-4299-afd7-040465398a58",
            deeplink: ''
          },
      ],
      title: 'Sample'
    }

      const carousels = {
        data: [
        {
          id: '1',
          image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/1.png?alt=media&token=f5a68d36-4a4c-4bd0-988c-8f85abdc3c09",
          deeplink: ''
        },
        {
          id: '2',
          image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/2.png?alt=media&token=5f71826e-eb66-4281-8626-e2fe32b9e0fe",
          deeplink: ''
        },
        {
          id: '3',
          image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/3.png?alt=media&token=1a4699c5-ec0d-4faa-8a5c-4bf013008357",
          deeplink: ''
        },
      ],
    title: 'To Create your cart, try saying,'
  }
  
      res.status(200).json({
        welcomeText,
        welcomeSubText,
        banners,
        carousels
      })
    } 
    catch (error) {
      handleError(error, res);
    }
  });

export default homeRouter;