import AnnouncementRepository, {
  AnnouncementListFilters,
} from '../repositories/announcement.repository';
import Announcement from '../models/Announcement';
import { broadcastToApprovedMembers } from '../../services/notification.service';
import { logger } from '../../utils/logger';

export class AnnouncementService {
  public static async listAdmin(filters: AnnouncementListFilters) {
    await AnnouncementRepository.markExpired();
    return AnnouncementRepository.list(filters);
  }

  public static async listMobile(filters: AnnouncementListFilters) {
    await AnnouncementRepository.markExpired();
    return AnnouncementRepository.listPublished(filters);
  }

  public static async getById(id: number) {
    return AnnouncementRepository.findById(id);
  }

  public static async create(data: Partial<Announcement>, adminId: number) {
    return AnnouncementRepository.create({
      ...data,
      created_by: adminId,
      updated_by: adminId,
    });
  }

  public static async update(id: number, data: Partial<Announcement>, adminId: number) {
    return AnnouncementRepository.update(id, {
      ...data,
      updated_by: adminId,
    });
  }

  public static async remove(id: number) {
    return AnnouncementRepository.destroy(id);
  }

  public static async publish(id: number, adminId: number) {
    const existing = await AnnouncementRepository.findById(id);
    if (!existing) return null;

    const published = await AnnouncementRepository.update(id, {
      status: 'Published',
      publish_date: existing.publish_date || new Date(),
      updated_by: adminId,
    } as any);

    if (published) {
      void AnnouncementService.notifyMembers(published, 'published');
    }

    return published;
  }

  public static async unpublish(id: number, adminId: number) {
    return AnnouncementRepository.update(id, {
      status: 'Draft',
      updated_by: adminId,
    } as any);
  }

  public static async notifyMembers(
    announcement: Announcement,
    action: 'published' | 'updated',
  ) {
    try {
      const title =
        action === 'published' ? 'New Club Announcement' : 'Announcement Updated';
      await broadcastToApprovedMembers({
        title,
        body: announcement.title,
        data: {
          type: 'announcement',
          action,
          announcementId: String(announcement.id),
        },
      });
    } catch (err) {
      logger.error('[Announcement] Failed to broadcast push:', err);
    }
  }

  public static async markRead(announcementId: number, userId: number) {
    return AnnouncementRepository.markRead(announcementId, userId);
  }

  public static async getReadIds(userId: number, ids: number[]) {
    return AnnouncementRepository.getReadIds(userId, ids);
  }

  public static async getSyncSnapshot() {
    // Read-only — do not markExpired on every poll (that hammers the DB).
    return AnnouncementRepository.getSyncSnapshot();
  }
}

export default AnnouncementService;
