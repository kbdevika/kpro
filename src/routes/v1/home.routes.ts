import express from 'express';
import prisma from '../../config/prisma.config';
import handleError from '../../helper/handleError';

const homeRouter = express.Router();

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Retrieve home screen data
 *     description: Returns banners, carousels, and categories for the home screen.
 *     tags:
 *       - Home
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved home screen data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banner:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: https://placehold.co/240x320
 *                   description: A list of banner image URLs.
 *                 carousel:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       image_url:
 *                         type: string
 *                         example: https://placehold.co/240x320
 *                   description: A list of carousel items with IDs and image URLs.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred
 */
homeRouter.get('/', async (req: any, res: any) => {
    try {

      const banners = [
        "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/banner-1.png?alt=media&token=3c030890-91e2-4d14-8f28-1a8dfd11ab80",
        "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/banner-2.png?alt=media&token=74b70df1-2f33-4299-afd7-040465398a58"
      ]

      const carousels = [
        {
          id: '1',
          image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/1.png?alt=media&token=f5a68d36-4a4c-4bd0-988c-8f85abdc3c09"
        },
        {
          id: '2',
          image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/2.png?alt=media&token=5f71826e-eb66-4281-8626-e2fe32b9e0fe"
        },
        {
          id: '3',
          image_url: "https://firebasestorage.googleapis.com/v0/b/kiranapro-ios.firebasestorage.app/o/3.png?alt=media&token=1a4699c5-ec0d-4faa-8a5c-4bf013008357"
        },
      ]
  
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