import { Request, Response } from 'express';
import { ApprovalService } from '../../user/services/approval.service';
import { ApprovalValidation } from '../../user/validation/approval.validation';
import { logger } from '../../utils/logger';

export class ApprovalController {
  /**
   * GET /api/admin/pending-members
   */
  public static async getPendingMembers(_req: Request, res: Response): Promise<void> {
    try {
      const members = await ApprovalService.getPendingMembers();
      res.status(200).json({ members });
    } catch (error) {
      logger.error('Error fetching pending members:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve pending members' });
    }
  }

  /**
   * GET /api/admin/member/:id
   */
  public static async getMemberById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const member = await ApprovalService.getMemberById(parseInt(id));
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }
      res.status(200).json({ member });
    } catch (error) {
      logger.error(`Error fetching member detail for ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve member profile' });
    }
  }

  /**
   * POST /api/admin/member/:id/approve
   */
  public static async approveMember(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { confirm } = req.body;
      const adminId = req.user?.id || 1; // Fallback to 1 if no req.user

      const validation = ApprovalValidation.validateApprove(confirm);
      if (!validation.isValid) {
        res.status(400).json({ error: 'Bad Request', message: validation.message });
        return;
      }

      const member = await ApprovalService.approveMember(parseInt(id), adminId);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      res.status(200).json({ message: 'Member approved successfully', member });
    } catch (error) {
      logger.error(`Error approving member ${req.params.id}:`, error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to approve member' });
    }
  }

  /**
   * POST /api/admin/member/:id/reject
   */
  public static async rejectMember(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || 1;

      const validation = ApprovalValidation.validateReject(reason);
      if (!validation.isValid) {
        res.status(400).json({ error: 'Bad Request', message: validation.message });
        return;
      }

      const member = await ApprovalService.rejectMember(parseInt(id), adminId, reason);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      res.status(200).json({ message: 'Member rejected successfully', member });
    } catch (error) {
      logger.error(`Error rejecting member ${req.params.id}:`, error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reject member' });
    }
  }

  /**
   * POST /api/admin/member/:id/resubmit
   */
  public static async resubmitMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const member = await ApprovalService.resubmitMember(parseInt(id));
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      res.status(200).json({ message: 'Resubmitted successfully. Profile status is now pending.', member });
    } catch (error) {
      logger.error(`Error resubmitting member ${req.params.id}:`, error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to resubmit profile' });
    }
  }

  /**
   * GET /api/me/approval-status
   */
  public static async getMyApprovalStatus(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
        return;
      }

      const member = await ApprovalService.getMemberById(userId);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'User profile not found' });
        return;
      }

      res.status(200).json({
        approval_status: member.approval_status,
        status: member.status,
        rejection_reason: member.rejection_reason,
      });
    } catch (error) {
      logger.error('Error fetching user approval status:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve approval status' });
    }
  }
}
