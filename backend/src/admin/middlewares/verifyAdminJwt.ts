import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../../utils/jwt';
import { logger } from '../../utils/logger';

export interface AuthenticatedAdminRequest extends Request {
  admin?: JwtPayload;
}

/**
 * Middleware to verify custom backend Admin JWT in Authorization headers.
 */
export const verifyAdminJwt = (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is missing or malformed',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    // Set admin context
    req.admin = decoded;
    next();
  } catch (error) {
    logger.warn('Unauthorized admin request attempt:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is invalid or expired',
    });
  }
};
