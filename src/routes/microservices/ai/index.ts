import express from 'express';
import fetchJwtToken from '../../../helper/fetchAiJwtToken';
import convertToCart from '../../../helper/convertToCart';
import validateHeaders from '../../../helper/validateHeader';
import getPincodeFromCoordinates from '../../../helper/convertLatLongToPincode';
import handleError from '../../../helper/handleError';

const aiRouter = express.Router();

/**
 * @swagger
 * /ai/{id}:
 *   get:
 *     summary: Fetches enriched cart details by task ID
 *     description: This endpoint retrieves the enriched cart details using the provided task ID.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The task ID used to fetch the cart details.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the cart details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   type: object
 *                   description: The enriched cart details.
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
            return res.json({ cart: 'failed'})
        } else if(data.result === null && data.state === 'active') {
            return res.json({ cart: 'in-progress'})
        }
        
        const cart = await convertToCart(req.user.id, data)
        res.json(cart)

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

