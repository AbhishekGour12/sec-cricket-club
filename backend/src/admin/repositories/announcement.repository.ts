import { Op, WhereOptions } from 'sequelize';
import Announcement, { AnnouncementStatus } from '../models/Announcement';
import AnnouncementRead from '../models/AnnouncementRead';

export interface AnnouncementListFilters {
  search?: string;
  status?: string;
  type?: string;
  priority?: string;
  pinned?: boolean;
  page?: number;
  limit?: number;
}

/** Avoid writing Expired status on every mobile poll / list hit. */
const EXPIRE_THROTTLE_MS = 5 * 60 * 1000;
let lastAnnouncementExpireAt = 0;

export class AnnouncementRepository {
  public static async create(data: Partial<Announcement>): Promise<Announcement> {
    return Announcement.create(data as any);
  }

  public static async findById(id: number): Promise<Announcement | null> {
    return Announcement.findByPk(id);
  }

  public static async update(id: number, data: Partial<Announcement>): Promise<Announcement | null> {
    const row = await Announcement.findByPk(id);
    if (!row) return null;
    await row.update(data as any);
    return row;
  }

  public static async destroy(id: number): Promise<boolean> {
    const count = await Announcement.destroy({ where: { id } });
    return count > 0;
  }

  public static async list(filters: AnnouncementListFilters = {}) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const offset = (page - 1) * limit;

    const where: WhereOptions = {};

    if (filters.status) where.status = filters.status;
    if (filters.type) where.announcement_type = filters.type;
    if (filters.priority) where.priority = filters.priority;
    if (typeof filters.pinned === 'boolean') where.is_pinned = filters.pinned;

    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      Object.assign(where, {
        [Op.or]: [
          { title: { [Op.iLike]: q } },
          { short_description: { [Op.iLike]: q } },
          { description: { [Op.iLike]: q } },
          { announcement_type: { [Op.iLike]: q } },
        ],
      });
    }

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['is_pinned', 'DESC'],
        ['publish_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      announcements: rows,
    };
  }

  /**
   * Published announcements visible to approved members (not expired).
   */
  public static async listPublished(filters: AnnouncementListFilters = {}) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const offset = (page - 1) * limit;
    const now = new Date();

    const where: WhereOptions = {
      status: 'Published' as AnnouncementStatus,
      [Op.and]: [
        {
          [Op.or]: [{ publish_date: null }, { publish_date: { [Op.lte]: now } }],
        },
        {
          [Op.or]: [{ expiry_date: null }, { expiry_date: { [Op.gt]: now } }],
        },
      ],
    };

    if (filters.type) where.announcement_type = filters.type;
    if (typeof filters.pinned === 'boolean') where.is_pinned = filters.pinned;

    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      Object.assign(where, {
        [Op.or]: [
          { title: { [Op.iLike]: q } },
          { short_description: { [Op.iLike]: q } },
          { description: { [Op.iLike]: q } },
          { announcement_type: { [Op.iLike]: q } },
        ],
      });
    }

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['is_pinned', 'DESC'],
        ['publish_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      announcements: rows,
    };
  }

  public static async markExpired(): Promise<number> {
    const nowMs = Date.now();
    if (nowMs - lastAnnouncementExpireAt < EXPIRE_THROTTLE_MS) return 0;
    lastAnnouncementExpireAt = nowMs;

    const now = new Date();
    const [count] = await Announcement.update(
      { status: 'Expired' },
      {
        where: {
          status: 'Published',
          expiry_date: { [Op.lt]: now },
        },
      },
    );
    return count;
  }

  public static async markRead(announcementId: number, userId: number): Promise<AnnouncementRead> {
    const [row] = await AnnouncementRead.findOrCreate({
      where: { announcement_id: announcementId, user_id: userId },
      defaults: {
        announcement_id: announcementId,
        user_id: userId,
        read_at: new Date(),
      },
    });
    if (!row.read_at) {
      await row.update({ read_at: new Date() });
    }
    return row;
  }

  public static async getReadIds(userId: number, announcementIds: number[]): Promise<Set<number>> {
    if (announcementIds.length === 0) return new Set();
    const rows = await AnnouncementRead.findAll({
      where: {
        user_id: userId,
        announcement_id: { [Op.in]: announcementIds },
      },
      attributes: ['announcement_id'],
    });
    return new Set(rows.map((r) => r.announcement_id));
  }

  public static async getSyncSnapshot() {
    const now = new Date();
    const rows = await Announcement.findAll({
      where: {
        status: 'Published' as AnnouncementStatus,
        [Op.and]: [
          {
            [Op.or]: [{ publish_date: null }, { publish_date: { [Op.lte]: now } }],
          },
          {
            [Op.or]: [{ expiry_date: null }, { expiry_date: { [Op.gt]: now } }],
          },
        ],
      },
      attributes: ['id', 'title', 'short_description', 'updated_at', 'created_at', 'publish_date'],
      order: [
        ['updated_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: 10,
    });

    const latestUpdated = rows[0]?.updated_at ? new Date(rows[0].updated_at).getTime() : 0;
    const fingerprint = `${rows.length}:${latestUpdated}:${rows.map((r) => `${r.id}:${new Date(r.updated_at).getTime()}`).join(',')}`;

    return {
      fingerprint,
      count: rows.length,
      latest_updated_at: rows[0]?.updated_at ?? null,
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        short_description: r.short_description,
        updated_at: r.updated_at,
        created_at: r.created_at,
        publish_date: r.publish_date,
      })),
    };
  }
}

export default AnnouncementRepository;
