/**
 * KiranaPro Software Private Limited, 2024
 * 
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import healthCheckRouter from './src/routes/health.routes';
import ondcRouter from './src/routes/ondc.routes';
import v1Routers from './src/routes/v1';
import authRouter from './src/routes/v1/auth.routes';
import swaggerSpec from './swagger';

dotenv.config();

const app = express();
const wss = new WebSocketServer({ noServer: true });

app.use(express.json());

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
app.use('/', healthCheckRouter);
app.use('/', ondcRouter);
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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