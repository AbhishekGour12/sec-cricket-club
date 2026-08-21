import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import AdminMemberController from '../controllers/member.controller';
import { verifyAdminJwt } from '../middlewares/verifyAdminJwt';

const router = Router();

/**
 * Route to login using email and password (for Admin Panel)
 * POST /api/admin/auth/login
 */
router.post('/login', AuthController.loginWithCredentials);

/**
 * Route to request password reset email (Public)
 * POST /api/admin/auth/request-password-reset
 */
router.post('/request-password-reset', AuthController.requestPasswordReset);

/**
 * Route to reset password with encrypted token (Public)
 * POST /api/admin/auth/reset-password
 */
router.post('/reset-password', AuthController.resetPassword);


/**
 * Route to get current logged-in administrator details (JWT Protected)
 * GET /api/admin/auth/me
 */
router.get('/me', verifyAdminJwt as any, AuthController.getMe);

// ── Member management routes (admin only) ────────────────────────────────────
router.get('/members', verifyAdminJwt as any, AdminMemberController.getMembers);
router.get('/members/:id', verifyAdminJwt as any, AdminMemberController.getMemberById);
router.post('/members/:id/approve', verifyAdminJwt as any, AdminMemberController.approveMember);
router.post('/members/:id/reject', verifyAdminJwt as any, AdminMemberController.rejectMember);
router.post('/members/:id/approve-card', verifyAdminJwt as any, AdminMemberController.approveVisitingCard);
router.post('/members/:id/reject-card', verifyAdminJwt as any, AdminMemberController.rejectVisitingCard);

export default router;
