"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ws_1 = require("ws");
const razorpay_1 = __importDefault(require("razorpay"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const wss = new ws_1.WebSocketServer({ noServer: true });
// Middleware
app.use(express_1.default.json());
// JWT Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRE_MINUTES = 30;
// Razorpay Configuration
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxx',
    key_secret: process.env.RAZORPAY_SECRET || 'xxx'
});
// Auth Middleware
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const user = yield prisma.user.findUnique({
            where: { id: payload.sub }
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});
// Helper Functions
const createAccessToken = (userId) => {
    return jsonwebtoken_1.default.sign({ sub: userId }, SECRET_KEY, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
};
// Routes
const v1Router = express_1.default.Router();
// Auth Routes
v1Router.post('/auth/truecaller', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        // Validate Truecaller token (implement actual validation)
        const userId = token; // Get from Truecaller token
        let user = yield prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            user = yield prisma.user.create({
                data: { id: userId }
            });
        }
        const accessToken = createAccessToken(user.id);
        res.json({ access_token: accessToken, token_type: 'bearer' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// User Settings Routes
v1Router.get('/user/settings', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield prisma.userSetting.findMany({
            where: { userId: req.user.id }
        });
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
v1Router.post('/user/settings', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key, value } = req.body;
        yield prisma.userSetting.create({
            data: {
                userId: req.user.id,
                key,
                value
            }
        });
        res.json({ message: 'Setting created successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
v1Router.put('/user/settings/:key', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const updated = yield prisma.userSetting.updateMany({
            where: {
                userId: req.user.id,
                key
            },
            data: { value }
        });
        if (updated.count === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        res.json({ message: 'Setting updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
v1Router.delete('/user/settings/:key', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.params;
        const deleted = yield prisma.userSetting.deleteMany({
            where: {
                userId: req.user.id,
                key
            }
        });
        if (deleted.count === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        res.json({ message: 'Setting deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Address Routes
v1Router.get('/user/address', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const addresses = yield prisma.address.findMany({
            where: { userId: req.user.id }
        });
        res.json(addresses);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
v1Router.post('/user/address', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { street, city, state, country, postalCode } = req.body;
        const address = yield prisma.address.create({
            data: {
                userId: req.user.id,
                street,
                city,
                state,
                country,
                postalCode
            }
        });
        res.json({ message: 'Address created successfully', id: address.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Cart Routes
v1Router.post('/cart', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cart = yield prisma.cart.create({
            data: {
                userId: req.user.id
            }
        });
        res.json({ cart_id: cart.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
v1Router.get('/cart/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cart = yield prisma.cart.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                items: true
            }
        });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const subTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = 10.0;
        const total = subTotal + shipping;
        res.json({
            id: cart.id,
            items: cart.items,
            subTotal,
            shipping,
            total
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Order Routes
v1Router.post('/cart/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cart = yield prisma.cart.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const order = yield prisma.order.create({
            data: {
                cartId: cart.id,
                status: 'created'
            }
        });
        res.json({ order_id: order.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Payment Routes
v1Router.post('/payment', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.body;
        const payment = yield razorpay.orders.create({
            amount: 50000,
            currency: 'INR',
            payment_capture: true
        });
        res.json(payment);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Task Routes
v1Router.post('/agent', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = yield prisma.task.create({
            data: {
                status: 'processing',
                userId: req.user.id,
                summary: ''
            }
        });
        res.json({ task_id: task.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
v1Router.get('/task/:taskId', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = yield prisma.task.findFirst({
            where: {
                id: req.params.taskId,
                userId: req.user.id
            },
            include: {
                lineItems: true
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        if (task.status === 'success') {
            res.json({
                status: 'success',
                output: {
                    summary: task.summary,
                    lineItems: task.lineItems
                }
            });
        }
        else {
            res.json({ status: task.status });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// WebSocket handling
const handleWebSocket = (socket, req) => {
    const token = req.url.split('?token=')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!payload.sub) {
            socket.close(1008);
            return;
        }
        socket.on('message', (data) => {
            socket.send(`Message received: ${data}`);
        });
        socket.on('close', () => {
            console.log(`WebSocket disconnected for user ${payload.sub}`);
        });
    }
    catch (error) {
        socket.close(1008);
    }
};
// Apply routes
app.use('/v1', v1Router);
// Start server
const server = app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
wss.on('connection', handleWebSocket);
exports.default = server;
