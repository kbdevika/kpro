import admin from "../config/firebase.config";
import prisma from "../config/prisma.config";
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

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
                let user = await prisma.userModel.findUnique({
                    where: { id: decodedToken.uid }
                  });
              
                if (!user) {
                    user = await prisma.userModel.create({
                        data: { 
                            id: decodedToken.uid
                        }
                  });
    
                if(decodedToken.phone_number){
                    await prisma.userSettingsModel.create({
                        data: {
                          userId: decodedToken.uid,
                          settingsKey: "phone",
                          settingsValue: decodedToken.phone_number
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
            const user = await prisma.userModel.findUnique({
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

    async authenticateAdminToken(req: any, res: any, next: any) {
        const authHeader = req.headers['authorization'];
    
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
    
        const token = authHeader.split(' ')[1];
        
        // Decode the base64 encoded token
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [email, password] = decoded.split(':');
    
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing or Invalid inputs' });
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@kirana\.pro$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format. Only kirana.pro domain is allowed.' });
        }

        try {
            // Find user from the database
            const admin = await prisma.adminModel.findUnique({
                where: { adminEmail: email }
            });
    
            if (!admin) {
                return res.status(401).json({ error: 'User not found!' });
            }
    
            // Compare the decoded password with the stored hash
            const hashedPassword = crypto
                .createHmac('sha256', 'password-secret')
                .update(password)
                .digest('hex');
    
            if (hashedPassword !== admin.adminPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }
            
            next();
        } catch (error: any) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
}

export default new Middleware();
