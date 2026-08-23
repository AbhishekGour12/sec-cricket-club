import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sec_notification_inbox_v1';
const MAX_ITEMS = 80;

export type InboxNotificationType = 'announcement' | 'event';

export interface InboxNotification {
  id: string;
  type: InboxNotificationType;
  title: string;
  body: string;
  contentId: number;
  action: 'published' | 'updated' | 'unpublished';
  read: boolean;
  receivedAt: string;
}

interface NotificationInboxState {
  items: InboxNotification[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addNotification: (item: Omit<InboxNotification, 'id' | 'read' | 'receivedAt'> & { receivedAt?: string }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

async function persist(items: InboxNotification[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // best-effort
  }
}

export const useNotificationInboxStore = create<NotificationInboxState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as InboxNotification[]) : [];
      set({ items: Array.isArray(parsed) ? parsed : [], hydrated: true });
    } catch {
      set({ items: [], hydrated: true });
    }
  },

  addNotification: (item) => {
    const receivedAt = item.receivedAt || new Date().toISOString();
    const id = `${item.type}-${item.contentId}-${item.action}-${receivedAt}`;

    set((state) => {
      const duplicate = state.items.some(
        (existing) =>
          existing.type === item.type &&
          existing.contentId === item.contentId &&
          existing.action === item.action &&
          existing.receivedAt === receivedAt,
      );
      if (duplicate) return state;

      const next: InboxNotification[] = [
        {
          id,
          type: item.type,
          title: item.title,
          body: item.body,
          contentId: item.contentId,
          action: item.action,
          read: false,
          receivedAt,
        },
        ...state.items,
      ].slice(0, MAX_ITEMS);

      void persist(next);
      return { items: next };
    });
  },

  markRead: (id) => {
    set((state) => {
      const next = state.items.map((item) => (item.id === id ? { ...item, read: true } : item));
      void persist(next);
      return { items: next };
    });
  },

  markAllRead: () => {
    set((state) => {
      const next = state.items.map((item) => ({ ...item, read: true }));
      void persist(next);
      return { items: next };
    });
  },

  clearAll: () => {
    void persist([]);
    set({ items: [] });
  },

  unreadCount: () => get().items.filter((item) => !item.read).length,
}));

export default useNotificationInboxStore;
