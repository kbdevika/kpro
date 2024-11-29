import admin from "../config/firebase.config";
import prisma from "../config/prisma.config";
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

class Middleware{
    async decodeFirebaseToken(req: any, res: any, next: any){
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(400).json({ error: 'No token found in headers' });
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);

            if(decodedToken) {
                let user = await prisma.user.findUnique({
                    where: { id: decodedToken.uid }
                  });
              
                if (!user) {
                    user = await prisma.user.create({
                        data: { 
                            id: decodedToken.uid
                        }
                  });
    
                if(decodedToken.phone_number){
                    await prisma.userSetting.create({
                        data: {
                          userId: decodedToken.uid,
                          key: "phone",
                          value: decodedToken.phone_number
                        }
                    });
                }}

                req.user = {
                    id: decodedToken.uid,
                };
            }
            next();

        } catch (error: any) {
            res.status(401).json({ error: 'Invalid or expired token. ' + error.message });
            return;
        }
    }

    async authenticateJWTToken(req: any, res: any, next: any){
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
        
            if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
            }
        
            try {
            const payload = jwt.verify(token, SECRET_KEY) as any;
            const user = await prisma.user.findUnique({
                where: { id: payload.sub }
            });
        
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
        
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
}

export default new Middleware();
