import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import AnnouncementService from '../services/announcement.service';
import {
  isValidPriority,
  isValidStatus,
  isValidType,
  parseDate,
  serializeAnnouncement,
} from '../serializers/announcement.serializer';
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_PRIORITIES, ANNOUNCEMENT_STATUSES } from '../models/Announcement';
import User from '../../user/models/User';
import { logger } from '../../utils/logger';

const assertApprovedMember = async (userId?: number): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  if (!userId) return { ok: false, status: 401, message: 'Login required' };
  const user = await User.findByPk(userId);
  if (!user || user.approval_status !== 'approved' || user.status !== 'active') {
    return { ok: false, status: 403, message: 'Only approved members can view announcements' };
  }
  return { ok: true };
};

const parseAttachments = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const buildPayload = (body: any) => {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const short_description =
    typeof body.short_description === 'string' ? body.short_description.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!title || title.length > 200) {
    return { error: 'Title is required (max 200 characters)' };
  }
  if (!short_description || short_description.length > 500) {
    return { error: 'Short description is required (max 500 characters)' };
  }
  if (!description) {
    return { error: 'Description is required' };
  }

  const announcement_type = body.announcement_type || 'General';
  const priority = body.priority || 'Medium';
  const status = body.status || 'Draft';

  if (!isValidType(announcement_type)) {
    return { error: `Invalid announcement_type. Allowed: ${ANNOUNCEMENT_TYPES.join(', ')}` };
  }
  if (!isValidPriority(priority)) {
    return { error: `Invalid priority. Allowed: ${ANNOUNCEMENT_PRIORITIES.join(', ')}` };
  }
  if (!isValidStatus(status)) {
    return { error: `Invalid status. Allowed: ${ANNOUNCEMENT_STATUSES.join(', ')}` };
  }

  const publish_date = parseDate(body.publish_date);
  const expiry_date = parseDate(body.expiry_date);
  if (body.publish_date && !publish_date) return { error: 'Invalid publish_date' };
  if (body.expiry_date && !expiry_date) return { error: 'Invalid expiry_date' };

  return {
    data: {
      title,
      short_description,
      description,
      cover_image: body.cover_image ? String(body.cover_image) : null,
      attachments: parseAttachments(body.attachments),
      announcement_type,
      priority,
      is_pinned: body.is_pinned === true || body.is_pinned === 'true',
      status,
      publish_date,
      expiry_date,
    },
  };
};

export class AnnouncementController {
  /** GET /admin/announcements/meta */
  public static async getMeta(_req: any, res: Response): Promise<void> {
    res.status(200).json({
      types: ANNOUNCEMENT_TYPES,
      priorities: ANNOUNCEMENT_PRIORITIES,
      statuses: ANNOUNCEMENT_STATUSES,
    });
  }

  /** GET /admin/announcements */
  public static async adminList(req: any, res: Response): Promise<void> {
    try {
      const result = await AnnouncementService.listAdmin({
        search: req.query.search as string,
        status: req.query.status as string,
        type: req.query.type as string,
        priority: req.query.priority as string,
        pinned:
          req.query.pinned === 'true' ? true : req.query.pinned === 'false' ? false : undefined,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 20,
      });

      res.status(200).json({
        ...result,
        announcements: result.announcements.map((a) => serializeAnnouncement(a)),
      });
    } catch (error) {
      logger.error('Admin list announcements error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list announcements' });
    }
  }

  /** GET /admin/announcements/:id */
  public static async adminGetById(req: any, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const row = await AnnouncementService.getById(id);
      if (!row) {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }
      res.status(200).json({ announcement: serializeAnnouncement(row) });
    } catch (error) {
      logger.error('Admin get announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get announcement' });
    }
  }

  /** POST /admin/announcements */
  public static async adminCreate(req: any, res: Response): Promise<void> {
    try {
      const parsed = buildPayload(req.body);
      if (parsed.error) {
        res.status(400).json({ error: 'Bad Request', message: parsed.error });
        return;
      }

      const adminId = req.admin?.id;
      const created = await AnnouncementService.create(parsed.data!, adminId);

      if (created.status === 'Published') {
        void AnnouncementService.notifyMembers(created, 'published');
      }

      res.status(201).json({
        message: 'Announcement created successfully',
        announcement: serializeAnnouncement(created),
      });
    } catch (error) {
      logger.error('Admin create announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create announcement' });
    }
  }

  /** PUT /admin/announcements/:id */
  public static async adminUpdate(req: any, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await AnnouncementService.getById(id);
      if (!existing) {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }

      const parsed = buildPayload({ ...existing.toJSON(), ...req.body });
      if (parsed.error) {
        res.status(400).json({ error: 'Bad Request', message: parsed.error });
        return;
      }

      const updated = await AnnouncementService.update(id, parsed.data!, req.admin?.id);
      if (!updated) {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }

      if (updated.status === 'Published') {
        void AnnouncementService.notifyMembers(updated, 'updated');
      }

      res.status(200).json({
        message: 'Announcement updated successfully',
        announcement: serializeAnnouncement(updated),
      });
    } catch (error) {
      logger.error('Admin update announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update announcement' });
    }
  }

  /** DELETE /admin/announcements/:id */
  public static async adminDelete(req: any, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await AnnouncementService.getById(id);
      if (!existing) {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }

      // Best-effort delete cover/attachment files
      const files = [
        existing.cover_image,
        ...(Array.isArray(existing.attachments) ? existing.attachments : []),
      ].filter(Boolean) as string[];

      for (const fileUrl of files) {
        try {
          const abs = path.resolve(__dirname, '../../../', fileUrl.replace(/^\//, ''));
          if (fs.existsSync(abs)) fs.unlinkSync(abs);
        } catch {
          // ignore
        }
      }

      await AnnouncementService.remove(id);
      res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      logger.error('Admin delete announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete announcement' });
    }
  }

  /** PATCH /admin/announcements/:id/publish */
  public static async adminPublish(req: any, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const published = await AnnouncementService.publish(id, req.admin?.id);
      if (!published) {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }
      res.status(200).json({
        message: 'Announcement published successfully',
        announcement: serializeAnnouncement(published),
      });
    } catch (error) {
      logger.error('Admin publish announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to publish announcement' });
    }
  }

  /** PATCH /admin/announcements/:id/unpublish */
  public static async adminUnpublish(req: any, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const unpublished = await AnnouncementService.unpublish(id, req.admin?.id);
      if (!unpublished) {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }
      res.status(200).json({
        message: 'Announcement unpublished successfully',
        announcement: serializeAnnouncement(unpublished),
      });
    } catch (error) {
      logger.error('Admin unpublish announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to unpublish announcement' });
    }
  }

  /** POST /admin/announcements/upload */
  public static async adminUpload(req: any, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Bad Request', message: 'No file uploaded' });
        return;
      }
      const fileUrl = `/uploads/announcements/${req.file.filename}`;
      res.status(200).json({
        message: 'File uploaded successfully',
        url: fileUrl,
      });
    } catch (error) {
      logger.error('Admin announcement upload error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload file' });
    }
  }

  /** GET /mobile/announcements/sync — lightweight fingerprint for realtime polling */
  public static async mobileSync(req: any, res: Response): Promise<void> {
    try {
      const access = await assertApprovedMember(req.user?.id);
      if (!access.ok) {
        res.status(access.status).json({
          error: access.status === 401 ? 'Unauthorized' : 'Forbidden',
          message: access.message,
        });
        return;
      }

      const snapshot = await AnnouncementService.getSyncSnapshot();
      res.status(200).json(snapshot);
    } catch (error) {
      logger.error('Mobile sync announcements error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to sync announcements' });
    }
  }

  /** GET /mobile/announcements */
  public static async mobileList(req: any, res: Response): Promise<void> {
    try {
      const access = await assertApprovedMember(req.user?.id);
      if (!access.ok) {
        res.status(access.status).json({ error: access.status === 401 ? 'Unauthorized' : 'Forbidden', message: access.message });
        return;
      }

      const userId = req.user?.id;
      const result = await AnnouncementService.listMobile({
        search: req.query.search as string,
        type: req.query.type as string,
        pinned:
          req.query.pinned === 'true' ? true : req.query.pinned === 'false' ? false : undefined,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 20,
      });

      const ids = result.announcements.map((a) => a.id);
      const readIds = userId
        ? await AnnouncementService.getReadIds(userId, ids)
        : new Set<number>();

      res.status(200).json({
        ...result,
        announcements: result.announcements.map((a) =>
          serializeAnnouncement(a, {
            is_read: readIds.has(a.id),
            is_new: !readIds.has(a.id),
          }),
        ),
      });
    } catch (error) {
      logger.error('Mobile list announcements error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list announcements' });
    }
  }

  /** GET /mobile/announcements/:id */
  public static async mobileGetById(req: any, res: Response): Promise<void> {
    try {
      const access = await assertApprovedMember(req.user?.id);
      if (!access.ok) {
        res.status(access.status).json({ error: access.status === 401 ? 'Unauthorized' : 'Forbidden', message: access.message });
        return;
      }

      const id = parseInt(req.params.id, 10);
      const row = await AnnouncementService.getById(id);
      if (!row || row.status !== 'Published') {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }

      const now = new Date();
      if (row.expiry_date && new Date(row.expiry_date) < now) {
        res.status(404).json({ error: 'Not Found', message: 'Announcement has expired' });
        return;
      }

      const userId = req.user?.id;
      let is_read = false;
      if (userId) {
        await AnnouncementService.markRead(id, userId);
        is_read = true;
      }

      res.status(200).json({
        announcement: serializeAnnouncement(row, { is_read, is_new: false }),
      });
    } catch (error) {
      logger.error('Mobile get announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get announcement' });
    }
  }

  /** POST /mobile/announcements/:id/read */
  public static async mobileMarkRead(req: any, res: Response): Promise<void> {
    try {
      const access = await assertApprovedMember(req.user?.id);
      if (!access.ok) {
        res.status(access.status).json({ error: access.status === 401 ? 'Unauthorized' : 'Forbidden', message: access.message });
        return;
      }

      const id = parseInt(req.params.id, 10);
      const userId = req.user?.id;

      const row = await AnnouncementService.getById(id);
      if (!row || row.status !== 'Published') {
        res.status(404).json({ error: 'Not Found', message: 'Announcement not found' });
        return;
      }

      await AnnouncementService.markRead(id, userId);
      res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
      logger.error('Mobile mark-read announcement error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to mark as read' });
    }
  }
}

export default AnnouncementController;
