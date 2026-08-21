import { ApprovalRepository } from '../repositories/approval.repository';
import User from '../models/User';
import { sendPushNotification } from '../../services/notification.service';
import { emitContentUpdate } from '../../utils/realtime-publish';

export class ApprovalService {
  public static async getPendingMembers(): Promise<User[]> {
    return await ApprovalRepository.findPendingMembers();
  }

  public static async getApprovedMembers(): Promise<User[]> {
    return await ApprovalRepository.findApprovedMembers();
  }

  public static async getRejectedMembers(): Promise<User[]> {
    return await ApprovalRepository.findRejectedMembers();
  }

  public static async getMemberById(id: number): Promise<User | null> {
    return await ApprovalRepository.findById(id);
  }

  public static async approveMember(id: number, adminId: number): Promise<User | null> {
    const user = await ApprovalRepository.updateApproval(id, {
      approval_status: 'approved',
      status: 'active',
      approved_by: adminId,
      approved_at: new Date(),
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
    });

    if (user) {
      try {
        await sendPushNotification(user.fcm_token, {
          title: '🎉 Account Approved',
          body: 'Your profile has been reviewed and approved! Welcome to SEC Cricket Club.',
          data: { type: 'approval_approved', memberId: String(user.id) },
        });
      } catch (err) {
        // Log notification failure but don't crash
        console.error('Failed to send approval push notification:', err);
      }
      emitContentUpdate('members', 'refresh', {
        id: user.id,
        title: user.full_name || user.email || undefined,
        message: 'Member directory updated',
      });
    }

    return user;
  }

  public static async rejectMember(id: number, adminId: number, reason: string): Promise<User | null> {
    const user = await ApprovalRepository.updateApproval(id, {
      approval_status: 'rejected',
      status: 'inactive',
      rejected_by: adminId,
      rejected_at: new Date(),
      rejection_reason: reason,
      approved_by: null,
      approved_at: null,
    });

    if (user) {
      try {
        await sendPushNotification(user.fcm_token, {
          title: '❌ Profile Rejected',
          body: `Your profile registration was not accepted. Reason: ${reason}`,
          data: { type: 'approval_rejected', memberId: String(user.id), reason },
        });
      } catch (err) {
        console.error('Failed to send rejection push notification:', err);
      }
    }

    return user;
  }

  public static async resubmitMember(id: number): Promise<User | null> {
    return await ApprovalRepository.updateApproval(id, {
      approval_status: 'pending',
      status: 'inactive',
      rejection_reason: null,
      rejected_by: null,
      rejected_at: null,
      approved_by: null,
      approved_at: null,
    });
  }
}
