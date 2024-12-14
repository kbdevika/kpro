import express from 'express';

const healthCheckRouter = express.Router();
healthCheckRouter.get('/health', (req: any, res: any) => { res.status(200).json({ health: "OK" }) });

export default healthCheckRouter;