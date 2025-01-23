import express, { Request } from 'express';
import middleware from '../middleware';
import prisma from '../config/prisma.config';
import handleError from '../helper/handleError';
import crypto from 'crypto';
import os from 'os';
import { mapIncomingToOutgoing } from '../helper/orderToKikoOrder';
import kikoUrl, { AI_BASE_URL } from '../constants';
import fetchJwtToken from '../helper/fetchAiJwtToken';

const adminRouter = express.Router();

/** Check if the service is down or not */
adminRouter.get('/health', (req: any, res: any) => { res.status(200).json({ health: "OK" }) });

/** Add new admins */
adminRouter.post('/admin', middleware.authenticateAdminToken, async (req: Request, res: any) => {
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

adminRouter.get('/database', middleware.authenticateAdminToken, async (req: any, res: any) => {
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

// fetch unique users using email
adminRouter.get('/admin/fetch-admin-by-email', async (req: any, res: any) => {
    try {
        const { email } = req.body;
        const user = await prisma.adminModel.findUnique({
            where: {
                adminEmail: email
            }
        });
        return res.json(user);
    } catch (error) {
        handleError(error, res);
    }
});

adminRouter.get('/admin/orders', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        // Get the total number of orders
        const orderCount = await prisma.orderModel.count();

        // Fetch orders created today
        const latestOrderPerDay = await prisma.orderModel.findMany({
            orderBy: {
                createdDate: 'desc',
            },
            include: {
                address: true,
                cart: true
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

adminRouter.post('/admin/orders/recreate', middleware.authenticateAdminToken, async (req: any, res: any) => {
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
        return res.json({ message: "success", ...data });
    } catch (error) {
        handleError(error, res);
    }
});

adminRouter.post('/add-coupons', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        const { couponCode,
            discountType,
            discountValue,
            expiryDate,
            maximumOrderValue,
            minimumOrderValue,
            startDate,
            usageLimit,
        } = req.body;

        const coupon = await prisma.couponCodeModel.create({
            data: {
                couponCode,
                discountType,
                discountValue,
                expiryDate,
                maximumOrderValue,
                minimumOrderValue,
                startDate,
                usageLimit,
            }
        })
        return res.json(coupon);
    } catch (error) {
        handleError(error, res);
    }
});

adminRouter.put('/update-coupons', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        const { couponCode,
            discountType,
            discountValue,
            expiryDate,
            maximumOrderValue,
            minimumOrderValue,
            startDate,
            usageLimit,
        } = req.body;

        const coupon = await prisma.couponCodeModel.update({
            where: {
                couponCode
            },
            data: {
                discountType,
                discountValue,
                expiryDate,
                maximumOrderValue,
                minimumOrderValue,
                startDate,
                usageLimit,
            }
        })
        return res.json(coupon);
    } catch (error) {
        handleError(error, res);
    }
});

adminRouter.get('/fetch-kiko-stores', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {

        const response = await fetch(`${kikoUrl}/getStoreDetails`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        const data: StoresIndexingAPIResponse = await response.json();

        // Map pincodes from store details
        const pincodes = data.StoreDetails.map((store) => store.storeAddress.pincode);

        // Get unique pincodes
        const uniquePincodes = [...new Set(pincodes)];
        return res.json(uniquePincodes);
    } catch (error) {
        handleError(error, res);
    }
});

interface StoresIndexingAPIResponse {
    Success: boolean;
    Message: string;
    StoreDetails: StoreDetail[];
}

interface StoreDetail {
    storeAddress: StoreAddress;
    _id: string;
    storeName: string;
}

interface StoreAddress {
    pincode: number;
    address1: string;
    address2: string;
    nearBy: string;
    state: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    contactPersonName: string;
    contactPersonMobile: string;
}

adminRouter.get('/index-stores', middleware.authenticateAdminToken, async (req: any, res: any) => {
    try {
        // Fetch store details
        const response = await fetch(`${kikoUrl}/getStoreDetails`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        const data: StoresIndexingAPIResponse = await response.json();

        // Map pincodes from store details
        const pincodes = data.StoreDetails.map((store) => store.storeAddress.pincode);

        // Get unique pincodes
        const uniquePincodes = [...new Set(pincodes)];

        // Function to fetch data for each pincode
        const fetchPincodeData = async (pincode: number) => {
            // Fetch JWT token
            const jwtToken = await fetchJwtToken();
            const response = await fetch(`${AI_BASE_URL}/api/catalog/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwtToken}`,
                },
                body: JSON.stringify({ pincode }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Error for pincode ${pincode}: ${errorMessage}`);
            }

            return await response.json();
        };

        // Fetch pincode data concurrently
        const responses = await Promise.allSettled(
            uniquePincodes.map((pincode) => fetchPincodeData(pincode))
        );

        // Separate successful and failed responses
        const successResponses = responses
            .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
            .map((result) => result.value);

        const failedResponses = responses
            .filter((result): result is PromiseRejectedResult => result.status === "rejected")
            .map((result) => result.reason);

        return res.json({ successResponses, failedResponses, uniquePincodes });
    } catch (error) {
        handleError(error, res);
    }
});

adminRouter.get('/telemetry', middleware.authenticateAdminToken, async (req: any, res: any) => {
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

export default adminRouter;