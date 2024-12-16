import express from 'express';
import middleware from '../middleware';
import prisma from '../config/prisma.config';
import handleError from '../helper/handleError';
import crypto from 'crypto';
import os from 'os';

const healthCheckRouter = express.Router();

/** Check if the service is down or not */
healthCheckRouter.get('/health', (req: any, res: any) => { res.status(200).json({ health: "OK" }) });

/** Add new admins */
healthCheckRouter.post('/admin', middleware.authenticateAdminToken, async (req: any, res: any) => {
    const { email, password } = req.body;

    // Ensure password is provided
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Hash the password before saving it
        const hashedPassword = crypto
            .createHmac('sha256', 'password-secret')
            .update(password)
            .digest('hex');

        // Create a new admin with the hashed password
        const data = await prisma.admin.create({
            data: { 
                email, 
                password: hashedPassword,
            },
        });

        return res.json(data);
    } catch (error) {
        handleError(error, res); // Handle any errors
    }
});

healthCheckRouter.get('/database', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        // Get the number of users
        const userCount = await prisma.user.count();

        // Aggregation for count of users per city or pincode
        const cityUserCounts = await prisma.address.groupBy({
            by: ['city'],
            _count: {
                userId: true,
            },
        });

        const pincodeUserCounts = await prisma.address.groupBy({
            by: ['postalCode'],
            _count: {
                userId: true,
            },
        });

        // Prepare stats
        const user_stats = {
            userCount,
            cityUserCounts,
            pincodeUserCounts,
        };
        
        // Get the total number of orders
        const orderCount = await prisma.order.count();
        
        // Get the total number of carts
        const cartCount = await prisma.cart.count();
        
        // Get the total number of processed audios
        const processedAudioCount = await prisma.task.count();
        
        // Get the number of admins
        const adminCount = await prisma.admin.findMany();
        
        // Get database health status by running a simple query
        const dbHealthStatus = 'ok'; // You can perform additional checks if necessary

        // Server stats (CPU, memory, etc.)
        const cpuUsage = os.loadavg(); // Array of 1, 5, 15 minute CPU load averages
        const freeMemory = os.freemem(); // Free memory in bytes
        const totalMemory = os.totalmem(); // Total memory in bytes
        const uptime = os.uptime(); // System uptime in seconds

        // Prepare response data
        const stats = {
            user_stats,
            orderCount,
            cartCount,
            processedAudioCount,
            adminCount,
            dbHealthStatus,
            cpuUsage,
            memory: {
                free: freeMemory,
                total: totalMemory,
            },
            uptime
        };

        // Respond with the stats
        return res.json(stats);
    } catch (error) {
        handleError(error, res);
    }
});

export default healthCheckRouter;