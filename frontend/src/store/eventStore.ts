import { create } from 'zustand';

export const EVENT_TYPES = [
  'All',
  'League Match',
  'Tournament',
  'Friendly',
  'Club Gala',
  'Annual Event',
  'Other',
] as const;

export type EventTypeFilter = (typeof EVENT_TYPES)[number];

export type SponsorTier = 'Title Sponsor' | 'Co-Sponsor' | 'Associate Sponsor';

export interface EventSponsor {
  id?: number;
  sponsor_id?: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  tier: SponsorTier;
  display_order?: number;
}

export interface ClubEvent {
  id: number;
  event_name: string;
  event_type: string;
  event_date: string;
  start_time: string;
  venue_name: string;
  venue_address?: string | null;
  map_link?: string | null;
  teams_involved?: string | null;
  description?: string | null;
  event_image?: string | null;
  is_featured?: boolean;
  status?: string;
  sponsor_count?: number;
  sponsors?: EventSponsor[];
}

export interface EventToast {
  id: number;
  title: string;
  message?: string;
}

export type EventsViewMode = 'list' | 'calendar';

const todayKey = () => new Date().toISOString().slice(0, 10);
const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

interface EventUiState {
  selectedType: EventTypeFilter;
  searchQuery: string;
  viewMode: EventsViewMode;
  /** YYYY-MM */
  calendarMonth: string;
  /** YYYY-MM-DD */
  selectedCalendarDate: string;
  latestToast: EventToast | null;
  syncFingerprint: string | null;
  setSelectedType: (type: EventTypeFilter) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: EventsViewMode) => void;
  setCalendarMonth: (month: string) => void;
  setSelectedCalendarDate: (date: string) => void;
  setLatestToast: (toast: EventToast | null) => void;
  clearToast: () => void;
  setSyncFingerprint: (fingerprint: string | null) => void;
  resetFilters: () => void;
}

export const useEventStore = create<EventUiState>((set) => ({
  selectedType: 'All',
  searchQuery: '',
  viewMode: 'list',
  calendarMonth: currentMonthKey(),
  selectedCalendarDate: todayKey(),
  latestToast: null,
  syncFingerprint: null,
  setSelectedType: (selectedType) => set({ selectedType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setViewMode: (viewMode) => set({ viewMode }),
  setCalendarMonth: (calendarMonth) => set({ calendarMonth }),
  setSelectedCalendarDate: (selectedCalendarDate) => set({ selectedCalendarDate }),
  setLatestToast: (latestToast) => set({ latestToast }),
  clearToast: () => set({ latestToast: null }),
  setSyncFingerprint: (syncFingerprint) => set({ syncFingerprint }),
  resetFilters: () => set({ selectedType: 'All', searchQuery: '' }),
}));
