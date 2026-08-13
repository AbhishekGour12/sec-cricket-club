import EventRepository, {
  EventListFilters,
  SponsorInput,
} from '../repositories/event.repository';
import Event, { EventStatus } from '../models/Event';
import { broadcastToApprovedMembers } from '../../services/notification.service';
import { logger } from '../../utils/logger';

export class EventService {
  public static async listAdmin(filters: EventListFilters) {
    await EventRepository.markExpired();
    return EventRepository.list(filters);
  }

  public static async listMobile(filters: EventListFilters) {
    await EventRepository.markExpired();
    return EventRepository.listPublishedUpcoming(filters);
  }

  public static async listFeatured(limit = 3) {
    await EventRepository.markExpired();
    return EventRepository.listFeatured(limit);
  }

  public static async getById(id: number) {
    return EventRepository.findById(id);
  }

  public static async create(
    data: Partial<Event>,
    sponsors: SponsorInput[],
    adminId: number,
  ) {
    const created = await EventRepository.create({
      ...data,
      created_by: adminId,
      updated_by: adminId,
    });

    const withSponsors =
      sponsors.length > 0
        ? await EventRepository.replaceSponsors(created.id, sponsors)
        : await EventRepository.findById(created.id);

    if (withSponsors?.status === 'Published') {
      void EventService.notifyMembers(withSponsors, 'published');
    }

    return withSponsors;
  }

  public static async update(
    id: number,
    data: Partial<Event>,
    sponsors: SponsorInput[] | undefined,
    adminId: number,
  ) {
    const previous = await EventRepository.findById(id);
    const updated = await EventRepository.update(id, {
      ...data,
      updated_by: adminId,
    } as any);
    if (!updated) return null;

    const withSponsors = sponsors
      ? await EventRepository.replaceSponsors(id, sponsors)
      : await EventRepository.findById(id);

    if (!withSponsors) return null;

    if (withSponsors.status === 'Published') {
      const wasPublished = previous?.status === 'Published';
      void EventService.notifyMembers(
        withSponsors,
        wasPublished ? 'updated' : 'published',
      );
    }

    return withSponsors;
  }

  public static async getSyncSnapshot() {
    // Read-only — do not markExpired on every poll (that hammers the DB).
    return EventRepository.getSyncSnapshot();
  }

  public static async remove(id: number) {
    return EventRepository.destroy(id);
  }

  public static async publish(id: number, adminId: number) {
    const published = await EventRepository.setStatus(id, 'Published', adminId);
    if (published) {
      void EventService.notifyMembers(published, 'published');
    }
    return published;
  }

  public static async unpublish(id: number, adminId: number) {
    return EventRepository.setStatus(id, 'Draft', adminId);
  }

  public static async setStatus(id: number, status: EventStatus, adminId: number) {
    const updated = await EventRepository.setStatus(id, status, adminId);
    if (updated && status === 'Published') {
      void EventService.notifyMembers(updated, 'published');
    }
    return updated;
  }

  public static async notifyMembers(event: Event, action: 'published' | 'updated') {
    try {
      const title = action === 'published' ? 'New Club Event' : 'Event Updated';
      await broadcastToApprovedMembers({
        title,
        body: event.event_name,
        data: {
          type: 'event',
          action,
          eventId: String(event.id),
        },
      });
    } catch (err) {
      logger.error('[Event] Failed to broadcast push:', err);
    }
  }
}

export default EventService;
