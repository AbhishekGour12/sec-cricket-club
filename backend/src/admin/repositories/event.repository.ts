import { Op, WhereOptions, Order } from 'sequelize';
import Event, { EventStatus } from '../models/Event';
import Sponsor from '../models/Sponsor';
import EventSponsor, { SponsorTier } from '../models/EventSponsor';

export interface EventListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  event_type?: string;
  featured?: boolean;
  upcoming?: boolean;
  sort?: 'newest' | 'event_date' | 'recently_created';
}

export interface SponsorInput {
  sponsor_id?: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  tier: SponsorTier;
  display_order?: number;
}

const sponsorInclude = {
  model: EventSponsor,
  as: 'event_sponsors',
  include: [{ model: Sponsor, as: 'sponsor' }],
};

/** Avoid writing Expired status on every mobile poll / list hit. */
const EXPIRE_THROTTLE_MS = 5 * 60 * 1000;
let lastEventExpireAt = 0;

function buildOrder(sort?: EventListFilters['sort']): Order {
  switch (sort) {
    case 'event_date':
      return [
        ['event_date', 'ASC'],
        ['start_time', 'ASC'],
      ];
    case 'recently_created':
      return [['created_at', 'DESC']];
    case 'newest':
    default:
      return [['created_at', 'DESC']];
  }
}

export class EventRepository {
  public static async list(filters: EventListFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const offset = (page - 1) * limit;

    const where: WhereOptions = {};

    if (filters.status && filters.status !== 'All') {
      where.status = filters.status;
    }
    if (filters.event_type && filters.event_type !== 'All') {
      where.event_type = filters.event_type;
    }
    if (filters.featured) {
      where.is_featured = true;
    }
    if (filters.upcoming) {
      const today = new Date().toISOString().slice(0, 10);
      where.event_date = { [Op.gte]: today };
      where.status = filters.status && filters.status !== 'All' ? filters.status : 'Published';
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      Object.assign(where, {
        [Op.or]: [
          { event_name: { [Op.iLike]: q } },
          { venue_name: { [Op.iLike]: q } },
          { event_type: { [Op.iLike]: q } },
        ],
      });
    }

    const { rows, count } = await Event.findAndCountAll({
      where,
      include: [sponsorInclude],
      distinct: true,
      order: buildOrder(filters.sort),
      limit,
      offset,
    });

    return { rows, count, page, limit };
  }

  public static async listPublishedUpcoming(filters: EventListFilters = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const where: WhereOptions = {
      status: 'Published',
      event_date: { [Op.gte]: today },
    };

    if (filters.event_type && filters.event_type !== 'All') {
      where.event_type = filters.event_type;
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      Object.assign(where, {
        [Op.or]: [
          { event_name: { [Op.iLike]: q } },
          { venue_name: { [Op.iLike]: q } },
          { event_type: { [Op.iLike]: q } },
        ],
      });
    }

    const { rows, count } = await Event.findAndCountAll({
      where,
      include: [sponsorInclude],
      distinct: true,
      order: [
        ['event_date', 'ASC'],
        ['start_time', 'ASC'],
      ],
      limit,
      offset,
    });

    return { rows, count, page, limit };
  }

  public static async listFeatured(limit = 3) {
    const today = new Date().toISOString().slice(0, 10);
    return Event.findAll({
      where: {
        status: 'Published',
        is_featured: true,
        event_date: { [Op.gte]: today },
      },
      include: [sponsorInclude],
      order: [
        ['event_date', 'ASC'],
        ['start_time', 'ASC'],
      ],
      limit: Math.min(10, Math.max(1, limit)),
    });
  }

  public static async findById(id: number) {
    return Event.findByPk(id, { include: [sponsorInclude] });
  }

  public static async create(data: Partial<Event>) {
    return Event.create(data as any);
  }

  public static async update(id: number, data: Partial<Event>) {
    const event = await Event.findByPk(id);
    if (!event) return null;
    await event.update(data as any);
    return EventRepository.findById(id);
  }

  public static async destroy(id: number) {
    const event = await Event.findByPk(id);
    if (!event) return false;
    await EventSponsor.destroy({ where: { event_id: id } });
    await event.destroy();
    return true;
  }

  public static async setStatus(id: number, status: EventStatus, adminId: number) {
    return EventRepository.update(id, {
      status,
      updated_by: adminId,
    } as any);
  }

  public static async markExpired() {
    const now = Date.now();
    if (now - lastEventExpireAt < EXPIRE_THROTTLE_MS) return;
    lastEventExpireAt = now;

    const today = new Date().toISOString().slice(0, 10);
    await Event.update(
      { status: 'Expired' },
      {
        where: {
          status: 'Published',
          event_date: { [Op.lt]: today },
        },
      },
    );
  }

  public static async replaceSponsors(eventId: number, sponsors: SponsorInput[]) {
    await EventSponsor.destroy({ where: { event_id: eventId } });

    for (let i = 0; i < sponsors.length; i++) {
      const item = sponsors[i];
      let sponsor: Sponsor | null = null;

      if (item.sponsor_id) {
        sponsor = await Sponsor.findByPk(item.sponsor_id);
      }

      if (!sponsor) {
        sponsor = await Sponsor.create({
          name: item.name.trim(),
          logo: item.logo || null,
          website: item.website || null,
        });
      } else {
        await sponsor.update({
          name: item.name.trim() || sponsor.name,
          logo: item.logo !== undefined ? item.logo : sponsor.logo,
          website: item.website !== undefined ? item.website : sponsor.website,
        });
      }

      await EventSponsor.create({
        event_id: eventId,
        sponsor_id: sponsor.id,
        tier: item.tier,
        display_order: item.display_order ?? i,
      });
    }

    return EventRepository.findById(eventId);
  }

  /** Lightweight fingerprint for near-realtime mobile polling. */
  public static async getSyncSnapshot() {
    const today = new Date().toISOString().slice(0, 10);
    const where = {
      status: 'Published' as const,
      event_date: { [Op.gte]: today },
    };

    const [count, latestUpdatedAt, rows] = await Promise.all([
      Event.count({ where }),
      Event.max('updated_at', { where }),
      Event.findAll({
        where,
        attributes: ['id', 'event_name', 'updated_at', 'created_at', 'event_date', 'is_featured'],
        order: [
          ['updated_at', 'DESC'],
          ['id', 'DESC'],
        ],
        limit: 15,
      }),
    ]);

    const latestMs = latestUpdatedAt ? new Date(String(latestUpdatedAt)).getTime() : 0;
    const fingerprint = `${count}:${latestMs}`;

    return {
      fingerprint,
      count,
      latest_updated_at: latestUpdatedAt ? String(latestUpdatedAt) : null,
      items: rows.map((r) => ({
        id: r.id,
        title: r.event_name,
        event_name: r.event_name,
        updated_at: r.updated_at,
        created_at: r.created_at,
        event_date: r.event_date,
        is_featured: r.is_featured,
      })),
    };
  }
}

export default EventRepository;
