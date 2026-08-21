import User from '../models/User';

export class ApprovalRepository {
  public static async findPendingMembers(): Promise<User[]> {
    return await User.findAll({
      where: {
        approval_status: 'pending',
      },
      attributes: { exclude: ['fcm_token'] },
      order: [['created_at', 'DESC']],
    });
  }

  public static async findApprovedMembers(): Promise<User[]> {
    return await User.findAll({
      where: {
        approval_status: 'approved',
      },
      attributes: { exclude: ['fcm_token'] },
      order: [['created_at', 'DESC']],
    });
  }

  public static async findRejectedMembers(): Promise<User[]> {
    return await User.findAll({
      where: {
        approval_status: 'rejected',
      },
      attributes: { exclude: ['fcm_token'] },
      order: [['created_at', 'DESC']],
    });
  }

  public static async findById(id: number): Promise<User | null> {
    return await User.findByPk(id, { attributes: { exclude: ['fcm_token'] } });
  }

  public static async updateApproval(
    id: number,
    data: {
      approval_status: 'pending' | 'approved' | 'rejected';
      status: 'active' | 'inactive';
      approved_by?: number | null;
      approved_at?: Date | null;
      rejected_by?: number | null;
      rejected_at?: Date | null;
      rejection_reason?: string | null;
    }
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    return await user.update(data as any);
  }
}
