import { create } from 'zustand';

export type AnnouncementType =
  | 'General'
  | 'Meeting'
  | 'Event'
  | 'Emergency'
  | 'Holiday'
  | 'Club Update'
  | 'Tournament'
  | 'Business Update';

export type AnnouncementPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Announcement {
  id: number;
  title: string;
  short_description: string;
  description: string;
  cover_image?: string | null;
  attachments?: string[];
  announcement_type: AnnouncementType | string;
  priority: AnnouncementPriority | string;
  is_pinned: boolean;
  status: string;
  publish_date?: string | null;
  expiry_date?: string | null;
  created_at?: string;
  updated_at?: string;
  is_read?: boolean;
  is_new?: boolean;
}

export interface AnnouncementToast {
  title: string;
  id: number;
  message?: string;
}

export interface AnnouncementState {
  selectedType: string;
  searchQuery: string;
  latestToast: AnnouncementToast | null;
  syncFingerprint: string | null;
  setSelectedType: (type: string) => void;
  setSearchQuery: (query: string) => void;
  setLatestToast: (toast: AnnouncementToast | null) => void;
  setSyncFingerprint: (fingerprint: string | null) => void;
  clearToast: () => void;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  selectedType: 'All',
  searchQuery: '',
  latestToast: null,
  syncFingerprint: null,
  setSelectedType: (selectedType) => set({ selectedType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLatestToast: (latestToast) => set({ latestToast }),
  setSyncFingerprint: (syncFingerprint) => set({ syncFingerprint }),
  clearToast: () => set({ latestToast: null }),
}));

export default useAnnouncementStore;
