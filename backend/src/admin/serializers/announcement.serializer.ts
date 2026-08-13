import Announcement, {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementType,
} from '../models/Announcement';

export const serializeAnnouncement = (row: Announcement, extras?: Record<string, unknown>) => ({
  id: row.id,
  title: row.title,
  short_description: row.short_description,
  description: row.description,
  cover_image: row.cover_image,
  attachments: Array.isArray(row.attachments) ? row.attachments : [],
  announcement_type: row.announcement_type,
  priority: row.priority,
  is_pinned: row.is_pinned,
  status: row.status,
  publish_date: row.publish_date,
  expiry_date: row.expiry_date,
  created_by: row.created_by,
  updated_by: row.updated_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  ...extras,
});

export const isValidType = (value: unknown): value is AnnouncementType =>
  typeof value === 'string' && (ANNOUNCEMENT_TYPES as readonly string[]).includes(value);

export const isValidPriority = (value: unknown): value is AnnouncementPriority =>
  typeof value === 'string' && (ANNOUNCEMENT_PRIORITIES as readonly string[]).includes(value);

export const isValidStatus = (value: unknown): value is AnnouncementStatus =>
  typeof value === 'string' && (ANNOUNCEMENT_STATUSES as readonly string[]).includes(value);

export const parseDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};
