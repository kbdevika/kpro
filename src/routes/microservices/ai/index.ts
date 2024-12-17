import express from 'express';
import fetchJwtToken from '../../../helper/fetchAiJwtToken';
import convertToCart from '../../../helper/convertToCart';
import validateHeaders from '../../../helper/validateHeader';
import getPincodeFromCoordinates from '../../../helper/convertLatLongToPincode';
import handleError from '../../../helper/handleError';
import prisma from '../../../config/prisma.config';

const aiRouter = express.Router();

/**
 * @swagger
 * /ai/{taskId}:
 *   get:
 *     summary: Fetches enriched cart details by task ID
 *     description: This endpoint retrieves the enriched cart details using the provided task ID.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: The task ID used to fetch the cart details.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the cart details.
 *         content:
 *           application/json:
 *             examples:
 *               example1:
 *                 value:
 *                   cart:
 *                     cartId: string
 *                     items:
 *                       - itemId: string
 *                         itemName: "Mawana Sugar/Sakkare - Premium Crystal, 1 Kg Pouch"
 *                         itemDescription: "Mawana Premium Crystal Sugar is SULPHUR-FREE whitest refined sugar conforming to EEC Grade I standards. It is produced in a word class germ-free facility, with no Harmful chemicals used, completely untouched by hand and is hygienically packed in a Dust-free environment."
 *                         itemImageUrl:
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/70001579_10-mawana-sugar-premium-crystal.jpg"
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/70001579-2_9-mawana-sugar-premium-crystal.jpg"
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/70001579-3_8-mawana-sugar-premium-crystal.jpg"
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/70001579-4_8-mawana-sugar-premium-crystal.jpg"
 *                         itemQuantity: 1
 *                         itemOriginalPrice: 75
 *                         itemDiscountedPrice: 75
 *                         itemStockStatus: "In Stock"
 *                         itemWeight: 1
 *                         itemWeightUnit: "KG"
 *                     recommendedItems:
 *                       - itemId: string
 *                         itemName: string
 *                         itemDescription: "Mawana Brown Sugar contains real flavour, crunchy texture and the perfect way to enhance your coffee, cookies and dessert. It dissolves 3 times faster than the regular sugar and is an ideal partner for your coffee."
 *                         itemImageUrl:
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/40131642_2-mawana-sugar-brown.jpg"
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/40131642-2_2-mawana-sugar-brown.jpg"
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/40131642-3_2-mawana-sugar-brown.jpg"
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/40131642-4_2-mawana-sugar-brown.jpg"
 *                           - "https://www.bigbasket.com/media/uploads/p/xxl/40131642-5_1-mawana-sugar-brown.jpg"
 *                         itemQuantity: 1
 *                         itemOriginalPrice: 86
 *                         itemDiscountedPrice: 86
 *                         itemStockStatus: "In Stock"
 *                         itemWeight: 1
 *                         itemWeightUnit: "KG"
 *                   orderSummary:
 *                     subTotal: 470
 *                     total: 505
 *                     deliverytime: "25 minutes"
 *                     freeDeliveryThreshold: 199
 *                     deliveryCharges: 35
 *                     saved: "You saved ₹33.00!"
 *                     discount: 33
 *                   storeInfo:
 *                     storeName: string
 *                     storePhone: string
 *                     storeContactPerson: string
 *                     storeAddress: string
 *                   additionalInfo:
 *                     savingsMessage: string
 *                     cartNote: string
 *       400:
 *         description: Task ID is missing or invalid.
 *       500:
 *         description: Error occurred while processing the request.
 *       503:
 *         description: AI response fetching failed or in-progress.
 *     tags:
 *       - AI
 */
aiRouter.get('/:id', async (req: any, res: any) => {
    const taskId = req.params.id;

    if(!taskId){
        return res.status(400).json({ error: 'Task ID missing!'})
    }

    try{
        const jwtToken = await fetchJwtToken();
        const response = await fetch(`https://dev-ai-api.kpro42.com/api/cart/enrich/${taskId}`, {
            method: 'GET',
            headers: {
            Authorization: `Bearer ${jwtToken}`,
            }
        });

        if(!response.ok){
            return res.status(response.status).json({ error: `Error occured while fetching AI response. ${response.text()}`})
        }

        const data = await response.json()

        if(data.state === 'failed') {
            return res.json({ cartStatus: 'failed'})
        } else if(data.result === null && data.state === 'active') {
            return res.json({ cartStatus: 'in-progress'})
        }
        
        const cart = await convertToCart(req.user.id, data)

        if(cart){
            await prisma.task.create({
                data:{
                    taskId: taskId,
                    status: 'success',
                    cartId: cart.cartId,
                    userId: req.user.id
                }
            })

            await prisma.notification.create({
                data:{
                    message: `Your cart is ready`,
                    createdDate: new Date().toISOString(),
                }
            })
        }

        res.json({cartStatus: 'completed', cart: cart})

    } catch (error){
        handleError(error, res)
    }
})

/**
 * @swagger
 * /ai:
 *   get:
 *     summary: Verifies if stores exist for a given pincode from coordinates
 *     description: This endpoint retrieves store information for a given pincode based on the user’s coordinates.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: User-Agent
 *         in: header
 *         description: User-Agent header must contain latitude and longitude in the format `lat:<latitude>; lon:<longitude>`
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved pincode verification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pincode:
 *                   type: boolean
 *                   description: Indicates whether the pincode has associated stores.
 *       400:
 *         description: Invalid User-Agent header or pincode missing.
 *       500:
 *         description: Error occurred while processing the request.
 *     tags:
 *       - AI
 */
aiRouter.get('/', async (req: any, res: any) => {
    try {
        // Extract the User-Agent header
        const userAgent = req.headers['user-agent'];

        // Validate User-Agent header
        const coordinates = validateHeaders(userAgent);
        if (!coordinates) {
        return res.status(400).json({ error: 'Missing or invalid User-Agent header.' });
        }

        const { latitude, longitude } = coordinates;
        // Get pincode from coordinates
        const pincode = await getPincodeFromCoordinates(latitude, longitude);

        if(!pincode){
            return res.status(400).json({ error: 'Pincode missing!'})
        }

        const jwtToken = await fetchJwtToken();
        const response = await fetch(`https://dev-ai-api.kpro42.com/api/stores/${pincode}`, {
            method: 'GET',
            headers: {
            Authorization: `Bearer ${jwtToken}`,
            }
        });

        if(!response.ok){
            return res.status(response.status).json({ error: `Error occured while fetching AI response. ${response.text}`})
        }

        const data = await response.json()
        if(data.stores.length > 0) {
            return res.json({ pincode: true })
        }

        res.json({ pincode: false })

    } catch (error){
        handleError(error, res)
    }
})

export default aiRouter;

