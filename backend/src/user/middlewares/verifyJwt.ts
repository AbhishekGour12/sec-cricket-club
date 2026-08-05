import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../../utils/jwt';
import { logger } from '../../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware to verify custom backend JWT in Authorization headers.
 */
export const verifyJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Unauthorized request attempt:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is invalid or expired',
    });
  }
};
