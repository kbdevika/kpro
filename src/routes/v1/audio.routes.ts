import express from 'express';
import handleError from '../../helper/handleError';
import convertToCart from '../../helper/convertToCart';
import multer from 'multer';
import prisma from '../../config/prisma.config';

const audioRouter = express.Router();

// Middleware to handle audio file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory for simplicity
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/mpeg') {
            cb(null, true); // Accept MP3 files
        } else {
            cb(new Error('Only MP3 files are allowed!'));
        }
    },
  });
  

/**
 * @swagger
 * /audio:
 *   post:
 *     summary: Upload an audio file and retrieve cart details
 *     description: This endpoint allows users to upload an audio file (MP3 format only) and receive a response containing a sample cart structure.
 *     tags:
 *       - Audio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: User-Agent
 *         required: true
 *         schema:
 *           type: string
 *           example: "CustomAgent/V1.0 (lat:12.00000; lon: 78.255555)"
 *         description: "The User-Agent header must follow the format: CustomAgent/V1.0 (lat:<latitude>; lon:<longitude>)."
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: The MP3 file to upload.
 *     responses:
 *       200:
 *         description: Audio file uploaded successfully and cart details returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "cart_123"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "item_123"
 *                           name:
 *                             type: string
 *                             example: "Sample Item"
 *                           price:
 *                             type: number
 *                             format: float
 *                             example: 20
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                     subTotal:
 *                       type: number
 *                       format: float
 *                       example: 40
 *                     shipping:
 *                       type: number
 *                       format: float
 *                       example: 10
 *                     total:
 *                       type: number
 *                       format: float
 *                       example: 50
 *       400:
 *         description: Bad Request - No file uploaded or invalid file type.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No file uploaded"
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */
audioRouter.post('/', 
    upload.single('audio'), // Expect an 'audio' file in the request
    async (req: any, res: any) => {
        try {
            // Extract the User-Agent header
            const userAgent = req.headers['user-agent'];
    
            if (!userAgent && !userAgent.includes('lat:') && !userAgent.includes('lon:')) {
                return res.status(400).json({ error: 'Some headers are missing' });
            }
            
            const latLonRegex = /lat:\s*([\d.-]+);\s*lon:\s*([\d.-]+)/;
            const match = userAgent.match(latLonRegex);
    
            if (!match) {
                return res.status(400).json({ error: 'Latitude and longitude not found in header' });
            }
    
            // Extract latitude and longitude
            const latitude = parseFloat(match[1]);
            const longitude = parseFloat(match[2]);
    
            // Use type assertion to access `file`
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
    
            // Create FormData to send the file
            const formData = new FormData();
    
            try {
                // Convert the buffer into a Blob
                const audioBlob = new Blob([file.buffer], { type: file.mimetype });
                formData.append('audio', audioBlob, file.originalname);
            
            } catch (error: any) {
                res.json({ error: error.message})
            }
    
            // Perform the fetch call with multipart/form-data
            const response = await fetch('https://dev-ai-api.kpro42.com/api/process-audio', {
                method: 'POST',
                body: formData, // Use FormData as the body
            });
    
            // Parse the response
            if (!response.ok) {
                return res.status(response.status).json({ error: 'Failed to process audio' });
            }
            const data = await response.json();
    
            try {
                const cart = await convertToCart(data, latitude, longitude)
                res.status(200).json(cart)
            } catch (error: any) {
                res.json({ error: error.message})
            }
        } catch (error) {
            handleError(error, res);
        }
    })

export default audioRouter;