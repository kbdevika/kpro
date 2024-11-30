import express from 'express';
import handleError from '../../helper/handleError';
import convertToCart from '../../helper/convertToCart';
import multer from 'multer';

const audioRouter = express.Router();

// Middleware to handle audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/mpeg') {
            cb(null, true);
        } else {
            cb(new Error('Only MP3 files are allowed!'));
        }
    },
  });
  
/**
 * @swagger
 * /audio:
 *   post:
 *     summary: Process an audio file and create a cart
 *     description: Receives an audio file, extracts the cart information based on audio data, user location, and catalogue search.
 *     operationId: processAudioAndCreateCart
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: User-Agent
 *         in: header
 *         description: User-Agent header must contain latitude and longitude in the format `lat:<latitude>; lon:<longitude>`
 *         required: true
 *         type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to be processed
 *             required:
 *               - audio
 *     responses:
 *       '200':
 *         description: Cart successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cart successfully created
 *                 deliverytime:
 *                   type: string
 *                   example: '25 minutes'
 *                 saved:
 *                   type: string
 *                   example: '₹50.00'
 *                 storeName:
 *                   type: string
 *                   example: 'Example Store'
 *                 storePhone:
 *                   type: string
 *                   example: '+1234567890'
 *                 storeContactPerson:
 *                   type: string
 *                   example: 'John Doe'
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 'cart_1631671123456'
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Catalogue'
 *                     orderSummary:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/OrderItems'
 *                         subTotal:
 *                           type: number
 *                           format: float
 *                           example: 100.00
 *                         shipping:
 *                           type: number
 *                           format: float
 *                           example: 27.00
 *                         discount:
 *                           type: number
 *                           format: float
 *                           example: 10.00
 *                         total:
 *                           type: number
 *                           format: float
 *                           example: 117.00
 *       '400':
 *         description: Bad Request - Missing or invalid headers or audio file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Latitude and longitude not found in header'
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Failed to process audio'
 * components:
 *   schemas:
 *     Catalogue:
 *       type: object
 *       properties:
 *         l3:
 *           type: string
 *         l4:
 *           type: string
 *         __v:
 *           type: integer
 *         _id:
 *           type: string
 *         gst:
 *           type: number
 *           format: float
 *         tax:
 *           type: number
 *           format: float
 *         brand:
 *           type: string
 *         price:
 *           type: string
 *         status:
 *           type: string
 *         userId:
 *           type: string
 *         weight:
 *           type: number
 *           format: float
 *         skuCode:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         isDeleted:
 *           type: boolean
 *         productId:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         bulkUpload:
 *           type: boolean
 *         categoryId:
 *           type: string
 *         weightUnit:
 *           type: string
 *         description:
 *           type: string
 *         productName:
 *           type: string
 *         isReturnable:
 *           type: boolean
 *         packagedFood:
 *           type: boolean
 *         isCancellable:
 *           type: boolean
 *         packagingCost:
 *           type: number
 *           format: float
 *         productImages:
 *           type: array
 *           items:
 *             type: string
 *         subCategoryId:
 *           type: string
 *         countryOfOrigin:
 *           type: string
 *         discountedPrice:
 *           type: string
 *         availableQuantity:
 *           type: string
 *         statutory_reqs_packaged_commodities:
 *           $ref: '#/components/schemas/StatutoryReqsPackagedCommodities'
 *     OrderItems:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         amount:
 *           type: number
 *           format: float
 *         quantity:
 *           type: integer
 *         unit:
 *           type: string
 *         image:
 *           type: array
 *           items:
 *             type: string
 *     StatutoryReqsPackagedCommodities:
 *       type: object
 *       properties:
 *         item:
 *           type: string
 *         details:
 *           type: string
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
                if(cart === -1){
                    res.status(200).json({
                        message: 'Pincode is unserviceable'
                    })
                } else if (cart === 0) {
                    res.status(200).json({
                        message: 'Store available but no product match'
                    })
                } else {
                    res.status(200).json(cart)
                }
            } catch (error: any) {
                res.json({ error: error.message})
            }
        } catch (error) {
            handleError(error, res);
        }
    })

export default audioRouter;