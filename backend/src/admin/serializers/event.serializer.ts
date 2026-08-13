import {
  EVENT_TYPES,
  EVENT_STATUSES,
  EventType,
  EventStatus,
} from '../models/Event';
import {
  SPONSOR_TIERS,
  SPONSOR_TIER_PRIORITY,
  SponsorTier,
} from '../models/EventSponsor';

export function isValidEventType(value: unknown): value is EventType {
  return typeof value === 'string' && (EVENT_TYPES as readonly string[]).includes(value);
}

export function isValidEventStatus(value: unknown): value is EventStatus {
  return typeof value === 'string' && (EVENT_STATUSES as readonly string[]).includes(value);
}

export function isValidSponsorTier(value: unknown): value is SponsorTier {
  return typeof value === 'string' && (SPONSOR_TIERS as readonly string[]).includes(value);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseDateOnly(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  // Accept YYYY-MM-DD or ISO datetime → date-only
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return match[1];
}

export function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  // HH:mm or HH:mm:ss or h:mm AM/PM
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    const hour = Number(h);
    const minute = Number(m);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2]);
    const period = ampm[3].toUpperCase();
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (period === 'AM' && hour === 12) hour = 0;
    if (period === 'PM' && hour !== 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  return null;
}

export function serializeSponsorLink(row: any) {
  const sponsor = row.sponsor || row.Sponsor || {};
  return {
    id: row.id,
    event_id: row.event_id,
    sponsor_id: row.sponsor_id,
    tier: row.tier,
    display_order: row.display_order ?? 0,
    name: sponsor.name || '',
    logo: sponsor.logo || null,
    website: sponsor.website || null,
  };
}

export function sortSponsorsByTier(sponsors: any[]) {
  return [...sponsors].sort((a, b) => {
    const tierA = SPONSOR_TIER_PRIORITY[a.tier as SponsorTier] ?? 99;
    const tierB = SPONSOR_TIER_PRIORITY[b.tier as SponsorTier] ?? 99;
    if (tierA !== tierB) return tierA - tierB;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });
}

export function serializeEvent(row: any, extras: Record<string, unknown> = {}) {
  const links = Array.isArray(row.event_sponsors)
    ? row.event_sponsors
    : Array.isArray(row.EventSponsors)
      ? row.EventSponsors
      : [];

  const sponsors = sortSponsorsByTier(links.map(serializeSponsorLink));

  return {
    id: row.id,
    event_name: row.event_name,
    event_type: row.event_type,
    event_date: row.event_date,
    start_time: row.start_time,
    venue_name: row.venue_name,
    venue_address: row.venue_address || null,
    map_link: row.map_link || null,
    teams_involved: row.teams_involved || null,
    description: row.description || null,
    event_image: row.event_image || null,
    is_featured: !!row.is_featured,
    status: row.status,
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sponsor_count: sponsors.length,
    sponsors,
    ...extras,
  };
}

export function serializeEventListItem(row: any) {
  const full = serializeEvent(row);
  return {
    id: full.id,
    event_name: full.event_name,
    event_type: full.event_type,
    event_date: full.event_date,
    start_time: full.start_time,
    venue_name: full.venue_name,
    event_image: full.event_image,
    is_featured: full.is_featured,
    status: full.status,
    sponsor_count: full.sponsor_count,
  };
}

export { EVENT_TYPES, EVENT_STATUSES, SPONSOR_TIERS };
