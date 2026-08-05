import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import { generateToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';

export class AuthController {
  /**
   * Endpoint to login using admin email and password.
   * POST /api/admin/auth/login
   */
  public static async loginWithCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required',
        });
        return;
      }

      // Find administrator by email in database
      const admin = await Admin.findOne({ where: { email } });

      if (!admin || !admin.password) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
        return;
      }

      // Check password hash
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate custom backend JWT
      const token = generateToken({
        id: admin.id,
        email: admin.email,
        role: 'admin',
      });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          profile_image: admin.profile_image,
          role: 'admin',
        },
      });
    } catch (error) {
      logger.error('Admin Email login failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during authentication',
      });
    }
  }

  /**
   * Endpoint to verify current admin JWT and return profile details.
   * GET /api/admin/auth/me
   */
  public static async getMe(req: any, res: Response): Promise<void> {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No authenticated administrator in context',
        });
        return;
      }

      const admin = await Admin.findByPk(adminId);

      if (!admin) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Administrator profile not found',
        });
        return;
      }

      res.status(200).json({
        user: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          profile_image: admin.profile_image,
          role: 'admin',
        },
      });
    } catch (error) {
      logger.error('Error in Admin getMe handler:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve administrator profile details.',
      });
    }
  }
}
export default AuthController;
