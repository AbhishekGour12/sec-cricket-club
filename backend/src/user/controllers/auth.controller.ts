import { Request, Response } from 'express';
import { auth } from '../../config/firebase';
import { AuthService } from '../services/auth.service';
import User from '../models/User';
import { Notification } from '../../admin/models/Notification';
import { generateToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { serializeSelf } from '../serializers/user.serializer';

export class AuthController {
  /**
   * Endpoint to login or register a user using their Firebase Google ID Token.
   * POST /api/auth/google
   */
  public static async loginWithGoogle(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'idToken is required in request body',
        });
        return;
      }

      // 1. Verify token with Firebase Admin (support Mock mode for local testing)
      let uid: string;
      let email: string;
      let name: string;
      let picture: string;

      if (!auth) {
        if (process.env.NODE_ENV === 'production') {
          res.status(503).json({
            error: 'Configuration Error',
            message: 'Google Sign-In is temporarily unavailable.',
          });
          return;
        }
        if (idToken === 'mock-admin-token' || idToken === 'mock-member-token') {
          uid = idToken === 'mock-admin-token' ? 'mock-admin-uid-123' : 'mock-member-uid-123';
          email = idToken === 'mock-admin-token' ? 'admin-bypass@sec.com' : 'member@sec.com';
          name = idToken === 'mock-admin-token' ? 'Admin Bypass' : 'Member User';
          picture = '';
        } else {
          res.status(500).json({
            error: 'Configuration Error',
            message: 'Firebase Admin is not configured. Google Sign-In verification is unavailable. For testing, please sign in with "mock-member-token".',
          });
          return;
        }
      } else {
        logger.info('Verifying Firebase ID Token...');
        const decodedToken = await auth.verifyIdToken(idToken);
        uid = decodedToken.uid;
        email = decodedToken.email || '';
        name = decodedToken.name || '';
        picture = decodedToken.picture || '';
      }

      if (!email) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Firebase token does not contain a valid email address',
        });
        return;
      }

      // 2. Check if user already exists
      let user = await AuthService.findByFirebaseUid(uid);

      if (!user) {
        // Check by email in case they were imported
        user = await AuthService.findByEmail(email);
        if (user) {
          logger.info(`Existing imported member found by email: ${email}. Associating Firebase UID and auto-approving.`);
          await user.update({
            firebase_uid: uid,
            approval_status: 'approved',
            status: 'active',
            is_profile_completed: false, // Require completing profile assets on mobile
          });

          // Notify admin that an imported member has linked their Google account
          await Notification.create({
            type: 'new_registration',
            title: 'Imported Member Activated',
            message: `${user.full_name || email} (${email}) has linked their Google account and is now active. Profile completion pending.`,
            user_id: user.id,
          });
        } else {
          logger.info(`User not found in database. Registering new user for Firebase UID: ${uid}`);
          // Create new user in database
          user = await AuthService.createUser({
            firebase_uid: uid,
            email,
            full_name: name || '',
            profile_image: picture || '',
            approval_status: 'pending',
            status: 'inactive',
            is_profile_completed: false,
          });

          // Notify admin of a brand-new Google sign-up awaiting approval
          await Notification.create({
            type: 'new_registration',
            title: 'New Member Registration',
            message: `${name || email} (${email}) just signed up via Google and is awaiting admin approval.`,
            user_id: user.id,
          });
        }
      } else {
        logger.info(`User found in database. Logging in user ID: ${user.id}`);
        // Optionally update profile image or name if empty or changed
        if (!user.profile_image && picture) {
          await user.update({ profile_image: picture });
        }
      }

      // 3. Generate custom backend JWT
      const token = generateToken({
        id: user.id,
        email: user.email ?? email,
      });

      // 4. Return user details and JWT
      res.status(200).json({
        message: 'Authentication successful',
        token,
        user: serializeSelf(user),
      });
    } catch (error: any) {
      logger.error('Error during Google login authentication:', error);
      
      // Handle Firebase specific verification errors
      if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired Firebase ID token',
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to authenticate user. Please try again later.',
      });
    }
  }

  /**
   * Endpoint to verify current JWT and return current user details.
   * GET /api/auth/me
   */
  public static async getMe(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No authenticated user in context',
        });
        return;
      }

      // Since our JWT stores primary key id, let's query by PK
      const userFromDb = await User.findByPk(userId);

      if (!userFromDb) {
        res.status(404).json({
          error: 'Not Found',
          message: 'User profile not found',
        });
        return;
      }

      res.status(200).json({ user: serializeSelf(userFromDb) });
    } catch (error) {
      logger.error('Error in getMe handler:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve user profile details.',
      });
    }
  }
}
