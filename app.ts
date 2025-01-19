/**
 * Version 1.4.0
 * KiranaPro Software Private Limited (c)
 * 2024
 * 
 * KiranaPro Proprietary License v1.0
 */
import express, { Application } from 'express';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import adminRouter from './src/routes/admin.routes';
import ondcRouter from './src/routes/ondc.routes';
import v1Routers from './src/routes/v1';
import { RegisterRoutes } from "./src/routes/routes";

dotenv.config();

const app: Application = express();
const wss = new WebSocketServer({ noServer: true });

app.use(express.json());
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next(err);
});

RegisterRoutes(app);
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// WebSocket handling
const handleWebSocket = (socket: WebSocket, req: any) => {
  const token = req.url.split('?token=')[1];

  try {
    const payload = jwt.verify(token, SECRET_KEY) as any;
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
  } catch (error) {
    socket.close(1008);
  }
};

// Apply routes
app.use('/', adminRouter);
app.use('/', ondcRouter);
app.use('/v1', v1Routers);

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

export default server;