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

  /**
   * Request password reset link.
   * POST /api/admin/auth/request-password-reset
   */
  public static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const inputEmail = req.body?.email?.trim()?.toLowerCase();
      const envAdminEmail = (process.env.ADMIN_EMAIL || 'sportsentertainmentclub9@gmail.com').trim().toLowerCase();

      // Find target admin account in database
      let admin = null;
      if (inputEmail) {
        admin = await Admin.findOne({ where: { email: inputEmail } });
      }

      if (!admin) {
        admin = await Admin.findOne({ where: { email: envAdminEmail } });
      }

      if (!admin) {
        admin = await Admin.findOne();
      }

      if (!admin) {
        // Create default admin entry if database is completely empty
        admin = await Admin.create({
          email: envAdminEmail,
          full_name: 'Administrator',
        });
      }

      const { generateResetToken } = await import('../../utils/jwt');
      const { sendAdminPasswordResetEmail } = await import('../../utils/mailer');

      const resetToken = generateResetToken({ id: admin.id, email: admin.email });
      const frontendBaseUrl = process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

      // Dispatch password reset email to process.env.ADMIN_EMAIL
      const emailSent = await sendAdminPasswordResetEmail(envAdminEmail, resetUrl);

      if (!emailSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to send password reset email via SMTP. Please check server logs.',
        });
        return;
      }

      logger.info(`Password reset link dispatched to ${envAdminEmail} for admin ID ${admin.id} (${admin.email})`);

      res.status(200).json({
        message: `Password reset link has been successfully dispatched to ${envAdminEmail}`,
      });
    } catch (error) {
      logger.error('Error in requestPasswordReset:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process password reset request',
      });
    }
  }

  /**
   * Reset password with encrypted token.
   * POST /api/admin/auth/reset-password
   */
  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Token and new password are required',
        });
        return;
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'New password must be at least 6 characters long',
        });
        return;
      }

      const { verifyResetToken } = await import('../../utils/jwt');
      let payload;
      try {
        payload = verifyResetToken(token);
      } catch (tokenErr) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Password reset link is invalid or has expired. Please request a new link.',
        });
        return;
      }

      const admin = await Admin.findByPk(payload.id);
      if (!admin) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Administrator account was not found',
        });
        return;
      }

      // Hash new password and save to DB
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedPassword;
      await admin.save();

      logger.info(`Admin password successfully updated in database for ID ${admin.id} (${admin.email})`);

      res.status(200).json({
        message: 'Password has been updated successfully. You can now log in with your new password.',
      });
    } catch (error) {
      logger.error('Error resetting password:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reset password',
      });
    }
  }
}
export default AuthController;

