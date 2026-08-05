import { Router, Request, Response } from 'express';
import userAuthRoutes from '../user/routes/auth.routes';
import adminAuthRoutes from '../admin/routes/auth.routes';
import { verifyJwt } from '../user/middlewares/verifyJwt';
import { upload } from '../middlewares/upload';
import UserController from '../user/controllers/user.controller';
import MemberController from '../user/controllers/member.controller';
import UploadController from '../user/controllers/upload.controller';
import { ApprovalController } from '../admin/controllers/approval.controller';
import { verifyAdminJwt } from '../admin/middlewares/verifyAdminJwt';
import { verifyToken } from '../utils/jwt';
import { AdminMemberActionsController } from '../admin/controllers/admin-member.controller';
import { AdminProfileController } from '../admin/controllers/admin-profile.controller';
import { MemberImportController } from '../admin/controllers/member-import.controller';
import { NotificationController } from '../admin/controllers/notification.controller';

const router = Router();

const verifyUserOrAdminJwt = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is missing or malformed' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is invalid or expired' });
  }
};

// Mount auth routes
router.use('/auth', userAuthRoutes);
router.use('/admin/auth', adminAuthRoutes);

// Me endpoints
router.get('/me', verifyJwt as any, UserController.getMe);
router.put('/me', verifyJwt as any, UserController.updateMe);
router.post('/me/fcm-token', verifyJwt as any, UserController.saveFcmToken);
router.post('/me/request-approval', verifyJwt as any, UserController.requestApproval);

// Saved member network (bookmarks)
router.get('/me/bookmarks', verifyJwt as any, UserController.getBookmarks);
router.post('/me/bookmarks/:memberId', verifyJwt as any, UserController.toggleBookmark);
router.delete('/me/bookmarks/:memberId', verifyJwt as any, UserController.toggleBookmark);

// Members endpoints (categories and search must be declared before :id to prevent parameter clashing)
router.get('/members/categories', verifyJwt as any, MemberController.getCategories);
router.get('/members/search', verifyJwt as any, MemberController.searchMembers);
router.get('/members', verifyJwt as any, MemberController.getMembers);
router.get('/members/:id', verifyJwt as any, MemberController.getMemberById);

// Upload endpoints (support single images and array up to 5 images)
router.post('/upload/profile-image', verifyJwt as any, upload.single('image'), UploadController.uploadProfileImage);
router.post('/upload/business-logo', verifyJwt as any, upload.single('image'), UploadController.uploadBusinessLogo);
router.post('/upload/visiting-card', verifyJwt as any, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), UploadController.uploadVisitingCard);
router.post('/upload/business-images', verifyJwt as any, upload.array('images', 5), UploadController.uploadBusinessImages);

// Member Approval Endpoints
router.get('/me/approval-status', verifyJwt as any, ApprovalController.getMyApprovalStatus);
router.get('/admin/pending-members', verifyAdminJwt as any, ApprovalController.getPendingMembers);
router.get('/admin/member/:id', verifyAdminJwt as any, ApprovalController.getMemberById);
router.post('/admin/member/:id/approve', verifyAdminJwt as any, ApprovalController.approveMember);
router.post('/admin/member/:id/reject', verifyAdminJwt as any, ApprovalController.rejectMember);
router.post('/admin/member/:id/resubmit', verifyUserOrAdminJwt as any, ApprovalController.resubmitMember);

// Admin member profile administration
router.put('/admin/member/:id', verifyAdminJwt as any, AdminProfileController.updateMember);
router.delete('/admin/member/:id', verifyAdminJwt as any, AdminProfileController.deleteMember);

// Admin Custom Actions (Manual Create, Bulk Import)
router.post('/admin/members/create-manual', verifyAdminJwt as any, AdminMemberActionsController.createManualMember);
router.post('/admin/members/bulk-import', verifyAdminJwt as any, AdminMemberActionsController.bulkImportMembers);

// Spreadsheet import pipeline
router.get('/admin/members/import-template', verifyAdminJwt as any, MemberImportController.getTemplate);
router.get('/admin/members/import-columns', verifyAdminJwt as any, MemberImportController.getColumns);
router.post('/admin/members/import/validate', verifyAdminJwt as any, MemberImportController.validate);
router.post('/admin/members/import/error-report', verifyAdminJwt as any, MemberImportController.errorReport);
router.post('/admin/members/import/commit', verifyAdminJwt as any, MemberImportController.commit);

// Admin Notifications Center
router.get('/admin/notifications', verifyAdminJwt as any, NotificationController.getNotifications);
router.post('/admin/notifications/:id/read', verifyAdminJwt as any, NotificationController.markAsRead);

/**
 * Health Check Endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API Root Information Endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the SEC Cricket Club API Service',
    version: '1.0.0',
    status: 'active',
  });
});

export default router;
