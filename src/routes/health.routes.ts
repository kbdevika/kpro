import express from 'express';

const healthCheckRouter = express.Router();
healthCheckRouter.get('/health-check', (req: any, res: any) => { res.status(200).json({ health: "OK" }) });

export default healthCheckRouter;