import express, { Request } from 'express';
import handleError from '../../helper/handleError';
import convertToCart from '../../helper/convertToCart';
import multer from 'multer';
import getPincodeFromCoordinates from '../../helper/convertLatLongToPincode';
import fetchJwtToken from '../../helper/fetchAiJwtToken';
import validateHeaders from '../../helper/validateHeader';

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
 *     tags:
 *       - Audio
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
          // Validate user ID
          const userId = req.user?.id;
          if (!userId) {
            return res.status(401).json({ error: 'Unauthorized access or user not found!' });
          }
                  
          // Extract the User-Agent header
          const userAgent = req.headers['user-agent'];

          // Validate User-Agent header
          const coordinates = validateHeaders(userAgent);
          if (!coordinates) {
            return res.status(400).json({ error: 'Missing or invalid User-Agent header.' });
          }
    
          const { latitude, longitude } = coordinates;

          // Validate uploaded file
          const file = req.file;
          if (!file) {
            return res.status(400).json({ error: 'No file uploaded.' });
          }

          // Convert the buffer into a Blob
          const audioBlob = new Blob([file.buffer], { type: file.mimetype });
    
          // Get pincode from coordinates
          const pincode = await getPincodeFromCoordinates(latitude, longitude);
    
          // Create FormData for the second API call
          const formData = new FormData();
          formData.append('audio', audioBlob, file.originalname);
          formData.append('pincode', pincode);
    
          // const webhookBaseUrl =
          //   process.env.NODE_ENV === 'production'
          //     ? 'https://api.kpro42.com'
          //     : 'https://dev-api.kpro42.com';
          // const webhookUrl = `${webhookBaseUrl}/v1/webhook/${encodeURIComponent(userId)}`;
          // formData.append('webhookUrl', webhookUrl);
    
          // Fetch JWT token
          const jwtToken = await fetchJwtToken();
    
          // Perform the fetch call with multipart/form-data
          const response = await fetch('https://dev-ai-api.kpro42.com/api/audio/cart/enrich', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
            body: formData,
          });
    
          if (!response.ok) {
            return res
              .status(response.status)
              .json({ error: `Failed to process audio. ${await response.text()}` });
          }
    
          // Send success response
          const data = await response.json();
          return res.status(200).json({ taskId: data.taskId });
        } catch (error) {
            handleError(error, res);
        }
    })

export default audioRouter;