import { NextFunction, Request, Response } from "express";
import admin from "../firebase.config";
import prisma from "../prisma.config";

class Middleware{
    async decodeToken(req: any, res: Response, next: NextFunction){
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(400).json({ error: 'No token found in headers' });
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);

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
                }  
            }

            // Add user info to req.user
            req.user = {
                id: decodedToken.uid,
            };

            next();
        } catch (error: any) {
            res.status(403).json({ error: 'Invalid or expired token' + error.message });
            return;
        }

    }
}

export default new Middleware();
