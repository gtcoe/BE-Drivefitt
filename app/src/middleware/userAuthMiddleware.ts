import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../logging";
import { generateError } from "../services/util";
import constants from "../config/constants/drivefitt-constants";

interface JwtPayload {
  id: number;
  email: string;
  type: 'user' | 'admin';
}

export const userAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: false,
        message: constants.ERROR_MESSAGES.ACCESS_DENIED,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        status: false,
        message: constants.ERROR_MESSAGES.ACCESS_DENIED,
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as JwtPayload;
      
      // Check if it's a user token (not admin)
      if (decoded.type !== 'user') {
        return res.status(401).json({
          status: false,
          message: constants.ERROR_MESSAGES.ACCESS_DENIED,
        });
      }
      
      // Add user info to request object
      (req as any).user = {
        id: decoded.id,
        email: decoded.email,
        type: decoded.type,
      };
      
      next();
    } catch (jwtError) {
      logger.error(`JWT verification failed: ${generateError(jwtError)}`);
      return res.status(401).json({
        status: false,
        message: constants.ERROR_MESSAGES.ACCESS_DENIED,
      });
    }
  } catch (error) {
    logger.error(`Error in userAuthMiddleware: ${generateError(error)}`);
    return res.status(500).json({
      status: false,
      message: constants.ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export default userAuthMiddleware; 