import { Request } from "express";
import jwt from "jsonwebtoken";
import admin from "../config/firebase.config";
import prisma from "../config/prisma.config";
import * as dotenv from "dotenv";

dotenv.config();


// TSOA authentication module
export const expressAuthentication = async (
    request: Request,
    name?: string,
    scopes?: string[]
): Promise<any> => {
  const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";
  const authType = name || (process.env.NODE_ENV === "production" ? "firebase" : "jwt");
  
  if (authType === "jwt") {
    const authHeader = request.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      const payload = jwt.verify(token, SECRET_KEY) as any;
      const user = await prisma.userModel.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;  // Returning the user object for TSOA to access
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  if (authType === "firebase") {
    const token = request.headers["authorization"]?.split(" ")[1];

    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      if (decodedToken) {
        let user = await prisma.userModel.findUnique({
          where: { id: decodedToken.uid },
        });

        if (!user) {
          user = await prisma.userModel.create({
            data: { id: decodedToken.uid },
          });
        }

        return user;  // Returning the user for access in routes
      }

      throw new Error("Invalid or expired Firebase token");
    } catch (error) {
      throw new Error("Invalid or expired Firebase token");
    }
  }

  throw new Error("Unknown authentication scheme");
};
