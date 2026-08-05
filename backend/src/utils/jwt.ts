import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
const JWT_EXPIRES_IN = '7d'; // Token validity: 7 days

export interface JwtPayload {
  id: number;
  email: string;
  role?: string;
}

/**
 * Generates a signed JWT for the user.
 * @param user User object containing id, email, and optional role attributes
 */
export const generateToken = (user: { id: number; email: string; role?: string }): string => {
  try {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
    };
    if (user.role) {
      payload.role = user.role;
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    logger.error('Failed to generate JWT:', error);
    throw new Error('Token generation failed');
  }
};

/**
 * Verifies a JWT and returns the parsed payload.
 * @param token JWT string
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    throw error;
  }
};
