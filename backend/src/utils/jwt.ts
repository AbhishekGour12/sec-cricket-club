import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET || JWT_SECRET.includes('fallback_secret') || JWT_SECRET.includes('change_me')) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a strong value in production.');
  }
  logger.warn('JWT_SECRET is missing or weak. Set a strong secret before deploying.');
}

const signingSecret = JWT_SECRET || 'dev-only-jwt-secret';

export interface JwtPayload {
  id: number;
  email: string;
  role?: string;
}

export const generateToken = (user: { id: number; email: string; role?: string }): string => {
  try {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role || 'member',
    };
    return jwt.sign(payload, signingSecret, { expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    logger.error('Failed to generate JWT:', error);
    throw new Error('Token generation failed');
  }
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, signingSecret) as JwtPayload;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    throw error;
  }
};

export interface ResetTokenPayload {
  id: number;
  email: string;
  type: string;
}

export const generateResetToken = (admin: { id: number; email: string }): string => {
  try {
    const payload: ResetTokenPayload = {
      id: admin.id,
      email: admin.email,
      type: 'admin_password_reset',
    };
    return jwt.sign(payload, signingSecret, { expiresIn: '15m' });
  } catch (error) {
    logger.error('Failed to generate reset token:', error);
    throw new Error('Reset token generation failed');
  }
};

export const verifyResetToken = (token: string): ResetTokenPayload => {
  try {
    const decoded = jwt.verify(token, signingSecret) as ResetTokenPayload;
    if (decoded.type !== 'admin_password_reset') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    logger.error('Reset token verification failed:', error);
    throw error;
  }
};

