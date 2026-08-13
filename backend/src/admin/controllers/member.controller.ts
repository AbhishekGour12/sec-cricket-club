import { Request, Response } from 'express';
import User from '../../user/models/User';
import { logger } from '../../utils/logger';
import { sendPushNotification } from '../../services/notification.service';

export class AdminMemberController {
  /**
   * GET /api/admin/members
   * List all members with optional status filter
   */
  public static async getMembers(_req: Request, res: Response): Promise<void> {
    try {
      const members = await User.findAll({
        order: [['created_at', 'DESC']],
        attributes: { exclude: ['fcm_token'] },
      });
      res.status(200).json({ members });
    } catch (error) {
      logger.error('Admin getMembers error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve members' });
    }
  }

  /**
   * GET /api/admin/members/:id
   */
  public static async getMemberById(req: Request, res: Response): Promise<void> {
    try {
      const member = await User.findByPk(req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      const BusinessFlyer = (await import('../../user/models/BusinessFlyer')).default;
      const flyers = await BusinessFlyer.findAll({
        where: { user_id: member.id },
        order: [
          ['display_order', 'ASC'],
          ['id', 'ASC'],
        ],
      });

      res.status(200).json({
        member: {
          ...member.toJSON(),
          business_flyers: flyers.map((f) => ({
            id: f.id,
            user_id: f.user_id,
            image_url: f.image_url,
            display_order: f.display_order,
            created_at: f.created_at,
            updated_at: f.updated_at,
          })),
        },
      });
    } catch (error) {
      logger.error('Admin getMemberById error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve member' });
    }
  }

  /**
   * POST /api/admin/members/:id/approve
   * Approve a member — sets status to 'active'
   */
  public static async approveMember(req: Request, res: Response): Promise<void> {
    try {
      const member = await User.findByPk(req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      await member.update({
        approval_status: 'approved',
        status: 'active',
        rejection_reason: undefined,
      });

      // Push notification
      await sendPushNotification(member.fcm_token, {
        title: '🎉 Welcome to SEC Cricket Club!',
        body: 'Your membership has been approved. You now have full access to the club.',
        data: { type: 'member_approved', memberId: String(member.id) },
      });

      logger.info(`Admin approved member ID ${member.id}`);
      res.status(200).json({ message: 'Member approved successfully', member });
    } catch (error) {
      logger.error('Admin approveMember error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to approve member' });
    }
  }

  /**
   * POST /api/admin/members/:id/reject
   * Reject a member — sets status to 'rejected' with a reason
   */
  public static async rejectMember(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      if (!reason || String(reason).trim().length < 5) {
        res.status(400).json({ error: 'Bad Request', message: 'A rejection reason (min 5 chars) is required' });
        return;
      }

      const member = await User.findByPk(req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      await member.update({
        approval_status: 'rejected',
        status: 'inactive',
        rejection_reason: String(reason).trim(),
      });

      // Push notification
      await sendPushNotification(member.fcm_token, {
        title: '⚠️ Profile Update Required',
        body: `Your application was not approved. Reason: ${String(reason).trim()}`,
        data: { type: 'member_rejected', memberId: String(member.id), reason: String(reason).trim() },
      });

      logger.info(`Admin rejected member ID ${member.id} — reason: ${reason}`);
      res.status(200).json({ message: 'Member rejected', member });
    } catch (error) {
      logger.error('Admin rejectMember error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reject member' });
    }
  }

  /**
   * POST /api/admin/members/:id/approve-card
   * Approve only the visiting card
   */
  public static async approveVisitingCard(req: Request, res: Response): Promise<void> {
    try {
      const member = await User.findByPk(req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      await member.update({
        visiting_card_status: 'approved',
        visiting_card_rejection_reason: undefined,
      });

      await sendPushNotification(member.fcm_token, {
        title: '✅ Visiting Card Approved',
        body: 'Your visiting card has been verified and approved by the admin.',
        data: { type: 'card_approved', memberId: String(member.id) },
      });

      res.status(200).json({ message: 'Visiting card approved', member });
    } catch (error) {
      logger.error('Admin approveVisitingCard error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to approve visiting card' });
    }
  }

  /**
   * POST /api/admin/members/:id/reject-card
   * Reject only the visiting card with a reason
   */
  public static async rejectVisitingCard(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      if (!reason || String(reason).trim().length < 5) {
        res.status(400).json({ error: 'Bad Request', message: 'A rejection reason (min 5 chars) is required' });
        return;
      }

      const member = await User.findByPk(req.params.id);
      if (!member) {
        res.status(404).json({ error: 'Not Found', message: 'Member not found' });
        return;
      }

      await member.update({
        visiting_card_status: 'rejected',
        visiting_card_rejection_reason: String(reason).trim(),
      });

      await sendPushNotification(member.fcm_token, {
        title: '📋 Visiting Card Not Accepted',
        body: `Your visiting card was rejected. Reason: ${String(reason).trim()}`,
        data: {
          type: 'card_rejected',
          memberId: String(member.id),
          reason: String(reason).trim(),
        },
      });

      logger.info(`Admin rejected visiting card for member ID ${member.id}`);
      res.status(200).json({ message: 'Visiting card rejected', member });
    } catch (error) {
      logger.error('Admin rejectVisitingCard error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reject visiting card' });
    }
  }
}

export default AdminMemberController;
