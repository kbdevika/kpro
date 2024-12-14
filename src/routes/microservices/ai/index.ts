import express from 'express';
import fetchJwtToken from '../../../helper/fetchAiJwtToken';
import convertToCart from '../../../helper/convertToCart';
import validateHeaders from '../../../helper/validateHeader';
import getPincodeFromCoordinates from '../../../helper/convertLatLongToPincode';
import handleError from '../../../helper/handleError';

const aiRouter = express.Router();

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
        if(!data.result || data.result === null) {
            return res.json({ cart: 'Not ready' })
        }
        
        const cart = await convertToCart(req.user.id, data)
        res.json(cart)

    } catch (error){
        handleError(error, res)
    }
})

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

