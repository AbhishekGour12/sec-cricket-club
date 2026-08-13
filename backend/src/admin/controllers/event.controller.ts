import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import EventService from '../services/event.service';
import {
  serializeEvent,
  serializeEventListItem,
  isValidEventType,
  isValidEventStatus,
  isValidSponsorTier,
  isValidHttpUrl,
  parseDateOnly,
  normalizeTime,
  EVENT_TYPES,
  EVENT_STATUSES,
  SPONSOR_TIERS,
} from '../serializers/event.serializer';
import { SponsorInput } from '../repositories/event.repository';
import User from '../../user/models/User';
import { logger } from '../../utils/logger';

const DESCRIPTION_MAX = 1000;
const NAME_MAX = 200;

async function assertApprovedMember(req: any, res: Response): Promise<User | null> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    return null;
  }
  const user = await User.findByPk(userId);
  if (!user || user.approval_status !== 'approved' || user.status !== 'active') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only approved active members can access events',
    });
    return null;
  }
  return user;
}

function parseSponsors(raw: unknown): { error?: string; data?: SponsorInput[] } {
  if (raw === undefined || raw === null) return { data: undefined as any };
  if (!Array.isArray(raw)) return { error: 'Sponsors must be an array' };

  const sponsors: SponsorInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] || {};
    const name = String(item.name || '').trim();
    if (!name) return { error: `Sponsor #${i + 1}: name is required` };
    if (name.length > 200) return { error: `Sponsor #${i + 1}: name is too long` };

    const logo = item.logo != null ? String(item.logo).trim() : null;
    if (!logo) return { error: `Sponsor #${i + 1}: logo is required` };

    if (!isValidSponsorTier(item.tier)) {
      return { error: `Sponsor #${i + 1}: invalid tier` };
    }

    let website: string | null = null;
    if (item.website != null && String(item.website).trim()) {
      website = String(item.website).trim();
      if (!isValidHttpUrl(website)) {
        return { error: `Sponsor #${i + 1}: website must be a valid http(s) URL` };
      }
    }

    sponsors.push({
      sponsor_id: item.sponsor_id ? Number(item.sponsor_id) : undefined,
      name,
      logo,
      website,
      tier: item.tier,
      display_order: Number.isFinite(Number(item.display_order))
        ? Number(item.display_order)
        : i,
    });
  }

  return { data: sponsors };
}

function buildPayload(body: any, { partial = false } = {}) {
  const data: Record<string, unknown> = {};

  if (!partial || body.event_name !== undefined) {
    const name = String(body.event_name || '').trim();
    if (!name) return { error: 'Event name is required' };
    if (name.length > NAME_MAX) return { error: `Event name must be <= ${NAME_MAX} characters` };
    data.event_name = name;
  }

  if (!partial || body.event_type !== undefined) {
    if (!isValidEventType(body.event_type)) return { error: 'Invalid event type' };
    data.event_type = body.event_type;
  }

  if (!partial || body.event_date !== undefined) {
    const date = parseDateOnly(body.event_date);
    if (!date) return { error: 'Valid event date (YYYY-MM-DD) is required' };
    data.event_date = date;
  }

  if (!partial || body.start_time !== undefined) {
    const time = normalizeTime(body.start_time);
    if (!time) return { error: 'Valid start time is required' };
    data.start_time = time;
  }

  if (!partial || body.venue_name !== undefined) {
    const venue = String(body.venue_name || '').trim();
    if (!venue) return { error: 'Venue name is required' };
    if (venue.length > 200) return { error: 'Venue name is too long' };
    data.venue_name = venue;
  }

  if (body.venue_address !== undefined) {
    data.venue_address = String(body.venue_address || '').trim() || null;
  }

  if (body.map_link !== undefined) {
    const mapLink = String(body.map_link || '').trim();
    if (mapLink && !isValidHttpUrl(mapLink)) {
      return { error: 'Map link must be a valid http(s) URL' };
    }
    data.map_link = mapLink || null;
  }

  if (body.teams_involved !== undefined) {
    data.teams_involved = String(body.teams_involved || '').trim() || null;
  }

  if (body.description !== undefined) {
    const description = String(body.description || '').trim();
    if (description.length > DESCRIPTION_MAX) {
      return { error: `Description must be <= ${DESCRIPTION_MAX} characters` };
    }
    data.description = description || null;
  }

  if (body.event_image !== undefined) {
    data.event_image = body.event_image ? String(body.event_image).trim() : null;
  }

  if (body.is_featured !== undefined) {
    data.is_featured = Boolean(body.is_featured);
  }

  if (body.status !== undefined) {
    if (!isValidEventStatus(body.status)) return { error: 'Invalid status' };
    data.status = body.status;
  }

  return { data };
}

async function compressImageFile(filePath: string, maxWidth: number) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const tmp = `${filePath}.tmp`;
    let pipeline = sharp(filePath).rotate().resize({
      width: maxWidth,
      height: maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    });

    if (ext === '.png') {
      pipeline = pipeline.png({ quality: 80 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 80 });
    } else {
      pipeline = pipeline.jpeg({ quality: 80 });
    }

    await pipeline.toFile(tmp);
    fs.renameSync(tmp, filePath);
  } catch (err) {
    logger.warn('[Event] Image compression skipped:', err);
  }
}

export class EventController {
  public static async getMeta(_req: any, res: Response): Promise<void> {
    res.status(200).json({
      event_types: EVENT_TYPES,
      statuses: EVENT_STATUSES,
      sponsor_tiers: SPONSOR_TIERS,
      description_max: DESCRIPTION_MAX,
    });
  }

  public static async adminList(req: any, res: Response): Promise<void> {
    try {
      const result = await EventService.listAdmin({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        search: req.query.search ? String(req.query.search) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        event_type: req.query.type || req.query.event_type
          ? String(req.query.type || req.query.event_type)
          : undefined,
        featured:
          req.query.featured === 'true' || req.query.featured === '1' || req.query.filter === 'Featured',
        upcoming: req.query.filter === 'Upcoming' || req.query.upcoming === 'true',
        sort: (req.query.sort as any) || 'newest',
      });

      res.status(200).json({
        events: result.rows.map(serializeEventListItem),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.count,
          total_pages: Math.ceil(result.count / result.limit) || 1,
        },
      });
    } catch (error) {
      logger.error('[Event] adminList failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list events' });
    }
  }

  public static async adminGetById(req: any, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const event = await EventService.getById(id);
      if (!event) {
        res.status(404).json({ error: 'Not Found', message: 'Event not found' });
        return;
      }
      res.status(200).json({ event: serializeEvent(event) });
    } catch (error) {
      logger.error('[Event] adminGetById failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load event' });
    }
  }

  public static async adminCreate(req: any, res: Response): Promise<void> {
    try {
      const payload = buildPayload(req.body, { partial: false });
      if (payload.error) {
        res.status(400).json({ error: 'Validation Error', message: payload.error });
        return;
      }
      if (!payload.data!.status) payload.data!.status = 'Draft';

      const sponsorsParsed = parseSponsors(req.body.sponsors ?? []);
      if (sponsorsParsed.error) {
        res.status(400).json({ error: 'Validation Error', message: sponsorsParsed.error });
        return;
      }

      const event = await EventService.create(
        payload.data as any,
        sponsorsParsed.data || [],
        req.admin.id,
      );

      res.status(201).json({
        message: 'Event created successfully',
        event: serializeEvent(event),
      });
    } catch (error) {
      logger.error('[Event] adminCreate failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create event' });
    }
  }

  public static async adminUpdate(req: any, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const existing = await EventService.getById(id);
      if (!existing) {
        res.status(404).json({ error: 'Not Found', message: 'Event not found' });
        return;
      }

      const payload = buildPayload(req.body, { partial: true });
      if (payload.error) {
        res.status(400).json({ error: 'Validation Error', message: payload.error });
        return;
      }

      let sponsors: SponsorInput[] | undefined;
      if (req.body.sponsors !== undefined) {
        const sponsorsParsed = parseSponsors(req.body.sponsors);
        if (sponsorsParsed.error) {
          res.status(400).json({ error: 'Validation Error', message: sponsorsParsed.error });
          return;
        }
        sponsors = sponsorsParsed.data || [];
      }

      const event = await EventService.update(id, payload.data as any, sponsors, req.admin.id);
      res.status(200).json({
        message: 'Event updated successfully',
        event: serializeEvent(event),
      });
    } catch (error) {
      logger.error('[Event] adminUpdate failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update event' });
    }
  }

  public static async adminDelete(req: any, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const existing = await EventService.getById(id);
      if (!existing) {
        res.status(404).json({ error: 'Not Found', message: 'Event not found' });
        return;
      }

      // Best-effort remove image file
      if (existing.event_image?.startsWith('/uploads/')) {
        const filePath = path.resolve(__dirname, '../../../', `.${existing.event_image}`);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            /* ignore */
          }
        }
      }

      await EventService.remove(id);
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      logger.error('[Event] adminDelete failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete event' });
    }
  }

  public static async adminPublish(req: any, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const event = await EventService.publish(id, req.admin.id);
      if (!event) {
        res.status(404).json({ error: 'Not Found', message: 'Event not found' });
        return;
      }
      res.status(200).json({ message: 'Event published', event: serializeEvent(event) });
    } catch (error) {
      logger.error('[Event] adminPublish failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to publish event' });
    }
  }

  public static async adminUnpublish(req: any, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const event = await EventService.unpublish(id, req.admin.id);
      if (!event) {
        res.status(404).json({ error: 'Not Found', message: 'Event not found' });
        return;
      }
      res.status(200).json({ message: 'Event unpublished', event: serializeEvent(event) });
    } catch (error) {
      logger.error('[Event] adminUnpublish failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to unpublish event' });
    }
  }

  public static async adminSetStatus(req: any, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!isValidEventStatus(req.body.status)) {
        res.status(400).json({ error: 'Validation Error', message: 'Invalid status' });
        return;
      }
      const event = await EventService.setStatus(id, req.body.status, req.admin.id);
      if (!event) {
        res.status(404).json({ error: 'Not Found', message: 'Event not found' });
        return;
      }
      res.status(200).json({ message: 'Status updated', event: serializeEvent(event) });
    } catch (error) {
      logger.error('[Event] adminSetStatus failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update status' });
    }
  }

  public static async adminUploadEventImage(req: any, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Validation Error', message: 'Image file is required' });
        return;
      }
      await compressImageFile(req.file.path, 1600);
      const fileUrl = `/uploads/events/${req.file.filename}`;
      res.status(200).json({ message: 'File uploaded successfully', url: fileUrl });
    } catch (error) {
      logger.error('[Event] adminUploadEventImage failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload image' });
    }
  }

  public static async adminUploadSponsorLogo(req: any, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Validation Error', message: 'Logo file is required' });
        return;
      }
      await compressImageFile(req.file.path, 800);
      const fileUrl = `/uploads/sponsors/${req.file.filename}`;
      res.status(200).json({ message: 'File uploaded successfully', url: fileUrl });
    } catch (error) {
      logger.error('[Event] adminUploadSponsorLogo failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload logo' });
    }
  }

  /** GET /events/sync — lightweight fingerprint for realtime polling */
  public static async mobileSync(req: any, res: Response): Promise<void> {
    try {
      if (!(await assertApprovedMember(req, res))) return;
      const snapshot = await EventService.getSyncSnapshot();
      res.status(200).json(snapshot);
    } catch (error) {
      logger.error('[Event] mobileSync failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to sync events' });
    }
  }

  public static async mobileList(req: any, res: Response): Promise<void> {
    try {
      if (!(await assertApprovedMember(req, res))) return;

      const result = await EventService.listMobile({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        search: req.query.search ? String(req.query.search) : undefined,
        event_type: req.query.type || req.query.event_type
          ? String(req.query.type || req.query.event_type)
          : undefined,
        sort: 'event_date',
      });

      res.status(200).json({
        events: result.rows.map(serializeEventListItem),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.count,
          total_pages: Math.ceil(result.count / result.limit) || 1,
        },
      });
    } catch (error) {
      logger.error('[Event] mobileList failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list events' });
    }
  }

  public static async mobileFeatured(req: any, res: Response): Promise<void> {
    try {
      if (!(await assertApprovedMember(req, res))) return;
      const limit = Number(req.query.limit) || 10;
      const rows = await EventService.listFeatured(limit);
      res.status(200).json({ events: rows.map((row) => serializeEvent(row)) });
    } catch (error) {
      logger.error('[Event] mobileFeatured failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load featured events' });
    }
  }

  public static async mobileGetById(req: any, res: Response): Promise<void> {
    try {
      if (!(await assertApprovedMember(req, res))) return;

      const id = Number(req.params.id);
      const event = await EventService.getById(id);
      if (!event || event.status !== 'Published') {
        res.status(404).json({ error: 'Not Found', message: 'Event not found' });
        return;
      }
      res.status(200).json({ event: serializeEvent(event) });
    } catch (error) {
      logger.error('[Event] mobileGetById failed:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load event' });
    }
  }
}

export default EventController;
