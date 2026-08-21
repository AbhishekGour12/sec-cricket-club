import { Request, Response } from 'express';
import { auth } from '../../config/firebase';
import { AuthService } from '../services/auth.service';
import User from '../models/User';
import { Notification } from '../../admin/models/Notification';
import { generateToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { serializeSelf } from '../serializers/user.serializer';

import { verifyGoogleIdToken } from '../../utils/googleToken';

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

      const startMs = Date.now();

      // 1. Verify token with Firebase Admin (support Mock mode for local testing)
      let uid = '';
      let email = '';
      let name = '';
      let picture = '';

      if (process.env.NODE_ENV !== 'production' && (idToken === 'mock-admin-token' || idToken === 'mock-member-token')) {
        uid = idToken === 'mock-admin-token' ? 'mock-admin-uid-123' : 'mock-member-uid-123';
        email = idToken === 'mock-admin-token' ? 'admin-bypass@sec.com' : 'member@sec.com';
        name = idToken === 'mock-admin-token' ? 'Admin Bypass' : 'Member User';
        picture = '';
      } else {
        const t1 = Date.now();
        logger.info('[PERF] Inspecting ID Token...');

        try {
          const googleIdentity = await verifyGoogleIdToken(idToken);
          if (googleIdentity) {
            logger.info(`[PERF] 1. Google JWKS verify took: ${Date.now() - t1}ms`);
            uid = googleIdentity.uid;
            email = googleIdentity.email;
            name = googleIdentity.name;
            picture = googleIdentity.picture;
          }
        } catch (googleVerifyError: any) {
          logger.warn('Google JWKS verification failed, trying Firebase:', googleVerifyError?.message);
        }

        if (!email && auth) {
          try {
            const decodedToken = await auth.verifyIdToken(idToken);
            logger.info(`[PERF] 1. Firebase verifyIdToken took: ${Date.now() - t1}ms`);
            uid = decodedToken.uid;
            email = decodedToken.email || '';
            name = decodedToken.name || '';
            picture = decodedToken.picture || '';
          } catch (firebaseVerifyError: any) {
            logger.error('Token verification failed:', firebaseVerifyError);
          }
        }
      }

      if (!email) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Firebase token does not contain a valid email address',
        });
        return;
      }

      // 2. Check if user already exists
      const t2 = Date.now();
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

          // Async non-blocking notification to admin
          void Notification.create({
            type: 'new_registration',
            title: 'Imported Member Activated',
            message: `${user.full_name || email} (${email}) has linked their Google account and is now active. Profile completion pending.`,
            user_id: user.id,
          }).catch((err) => logger.warn('Failed to create notification:', err));
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

          // Async non-blocking notification to admin
          void Notification.create({
            type: 'new_registration',
            title: 'New Member Registration',
            message: `${name || email} (${email}) just signed up via Google and is awaiting admin approval.`,
            user_id: user.id,
          }).catch((err) => logger.warn('Failed to create notification:', err));
        }
      } else {
        logger.info(`User found in database. Logging in user ID: ${user.id}`);
        // Optionally update profile image or name if empty or changed
        if (!user.profile_image && picture) {
          void user.update({ profile_image: picture }).catch(() => {});
        }
      }
      logger.info(`[PERF] 2. User DB lookup/registration took: ${Date.now() - t2}ms`);

      // 3. Generate custom backend JWT
      const token = generateToken({
        id: user.id,
        email: user.email ?? email,
      });

      logger.info(`[PERF] ✅ TOTAL Backend loginWithGoogle took: ${Date.now() - startMs}ms`);

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

export default AuthController;
