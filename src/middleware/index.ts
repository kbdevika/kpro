import { NextFunction, Request, Response } from "express";
import admin from "../firebase.config";

class Middleware{
    async decodeToken(req: Request, res: Response, next: NextFunction){
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(400).json({ error: 'No token found in headers' });
            return;
        }

        try {
            await admin.auth().verifyIdToken(token);
            next();
        } catch (error) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }

    }
}

export default new Middleware();
