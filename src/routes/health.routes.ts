import express, { Request } from 'express';
import middleware from '../middleware';
import prisma from '../config/prisma.config';
import handleError from '../helper/handleError';
import crypto from 'crypto';
import os from 'os';
import { mapIncomingToOutgoing } from '../helper/orderToKikoOrder';
import kikoUrl from '../constants';

const healthCheckRouter = express.Router();

/** Check if the service is down or not */
healthCheckRouter.get('/health', (req: any, res: any) => { res.status(200).json({ health: "OK" }) });

/** Add new admins */
healthCheckRouter.post('/admin', middleware.authenticateAdminToken, async (req: Request, res: any) => {
    const { email, password } = req.body;

    // Ensure password is provided
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if email already exists
        const existingAdmin = await prisma.adminModel.findUnique({
            where: { adminEmail: email },
        });

        if (existingAdmin) {
            return res.status(409).json({ error: 'Email is already in use' });
        }

        // Hash the password before saving it
        const hashedPassword = crypto
            .createHmac('sha256', 'password-secret')
            .update(password)
            .digest('hex');

        // Create a new admin with the hashed password
        const data = await prisma.adminModel.create({
            data: {
                adminEmail: email,
                adminPassword: hashedPassword,
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
        const userCount = await prisma.userModel.count();

        // Aggregation for count of users per city or pincode
        const cityUserCounts = await prisma.userAddressModel.groupBy({
            by: ['addressCity'],
            _count: {
                userId: true,
            },
        });

        const pincodeUserCounts = await prisma.userAddressModel.groupBy({
            by: ['addressPostalCode'],
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
        const orderCount = await prisma.orderModel.count();

        // Get the total number of carts
        const cartCount = await prisma.cartModel.count();

        // Get the total number of processed audios
        const processedAudioCount = await prisma.taskModel.count();

        // Get the number of admins
        const adminCount = await prisma.adminModel.findMany();

        // Get database health status by running a simple query
        const dbHealthStatus = 'ok'; // You can perform additional checks if necessary

        // Prepare response data
        const stats = {
            user_stats,
            orderCount,
            cartCount,
            processedAudioCount,
            adminCount,
            dbHealthStatus,
        };

        // Respond with the stats
        return res.json(stats);
    } catch (error) {
        handleError(error, res);
    }
});

healthCheckRouter.get('/admin/orders', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        // Get the total number of orders
        const orderCount = await prisma.orderModel.count();

        // Fetch orders created today
        const latestOrderPerDay = await prisma.orderModel.findMany({
            orderBy: {
                createdDate: 'desc',
            }
        });

        // Prepare response data
        const stats = {
            orderCount,              // Total number of orders
            latestOrderPerDay,       // Orders created today
        };

        // Respond with the stats
        return res.json(stats);
    } catch (error) {
        handleError(error, res);
    }
});

healthCheckRouter.post('/admin/orders/recreate', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        const { orderId } = req.body;
        // Fetch orders created today
        const order = await prisma.orderModel.findUnique({
            where: {
                id: orderId
            },
            include: {
                address: true,
                cart: {
                    include: {
                        cartItems: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        const kikoOrder = mapIncomingToOutgoing(order.id, order.cart, order.cart.cartItems, order.address)

        const response = await fetch(`${kikoUrl}/kiranapro-create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(kikoOrder),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        const data = await response.json();

        return { message: "success", ...data };
    } catch (error) {
        handleError(error, res);
    }
});

healthCheckRouter.get('/telemetry', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        // Server stats (CPU, memory, etc.)
        const cpuUsage = os.loadavg(); // Array of 1, 5, 15 minute CPU load averages
        const freeMemory = os.freemem(); // Free memory in bytes
        const totalMemory = os.totalmem(); // Total memory in bytes
        const uptime = os.uptime(); // System uptime in seconds

        // Prepare response data
        const stats = {
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