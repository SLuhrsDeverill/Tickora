import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { apiResponse } from '../utils/apiResponse';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    apiResponse.unauthorized(res, 'No token provided');
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    apiResponse.unauthorized(res, 'No token provided');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'secret') as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    apiResponse.unauthorized(res, 'Invalid or expired token');
  }
}
