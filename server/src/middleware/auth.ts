import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    verificationLevel: number;
  };
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid JWT token',
      });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
      verificationLevel: number;
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        verificationLevel: true,
        subscriptionStatus: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({
        error: 'User not found or account deactivated',
      });
    }

    // Attach user to request
    (req as AuthRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationLevel: user.verificationLevel,
    };

    next();
    
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token',
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token validation failed',
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
    });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
}

export function requireVerification(level: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (user.verificationLevel < level) {
      return res.status(403).json({
        error: 'Verification required',
        message: `Please complete verification level ${level} to access this resource`,
        requiredLevel: level,
        currentLevel: user.verificationLevel,
      });
    }

    next();
  };
}

export function requireActiveSubscription() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionStatus: true },
    });

    if (userRecord?.subscriptionStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'An active subscription is required to access this feature',
        status: userRecord?.subscriptionStatus || 'EXPIRED',
      });
    }

    next();
  };
  }
