import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyJwt } from '../middlewares/verifyJwt';

const router = Router();

/**
 * Route to register or login using Firebase Google ID Token
 * POST /api/auth/google
 */
router.post('/google', AuthController.loginWithGoogle);

/**
 * Route to get current logged-in user profile details (JWT Protected)
 * GET /api/auth/me
 */
router.get('/me', verifyJwt as any, AuthController.getMe);

export default router;
