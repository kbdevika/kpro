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
  

audioRouter.post('/', upload.single('audio'), // Expect an 'audio' file in the request
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