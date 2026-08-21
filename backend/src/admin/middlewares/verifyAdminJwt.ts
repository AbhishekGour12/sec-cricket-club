import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../../utils/jwt';
import Admin from '../models/Admin';
import { logger } from '../../utils/logger';

export interface AuthenticatedAdminRequest extends Request {
  admin?: JwtPayload;
}

/**
 * Middleware to verify a backend admin JWT. Member tokens are rejected.
 */
export const verifyAdminJwt = async (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
    if (decoded.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Administrator access is required',
      });
      return;
    }

    const admin = await Admin.findByPk(decoded.id);
    if (!admin) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Administrator account was not found',
      });
      return;
    }

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
