import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { api } from '../services/api';
import { useAnnouncementStore } from '../store/announcementStore';

interface SyncItem {
  id: number;
  title: string;
  short_description?: string;
  updated_at?: string;
  created_at?: string;
}

interface SyncResponse {
  fingerprint: string;
  count: number;
  latest_updated_at?: string | null;
  items: SyncItem[];
}

async function showLocalAnnouncementNotice(title: string, body: string, id: number) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'announcement', announcementId: String(id), action: 'sync' },
        sound: true,
        color: '#1A2744',
      },
      trigger: null,
    });
  } catch {
    // Local notification is best-effort — UI toast still shows.
  }
}

const SYNC_INTERVAL_MS = 15_000;

/**
 * Announcement sync for approved members.
 * Polls while the app is active so unpublished announcements disappear promptly,
 * including when a push notification cannot be delivered.
 */
export function useAnnouncementRealtime(enabled: boolean) {
  const queryClient = useQueryClient();
  const setLatestToast = useAnnouncementStore((s) => s.setLatestToast);
  const setSyncFingerprint = useAnnouncementStore((s) => s.setSyncFingerprint);

  const fingerprintRef = useRef<string | null>(null);
  const knownUpdatedRef = useRef<Map<number, string>>(new Map());
  const primedRef = useRef(false);
  const queryClientRef = useRef(queryClient);
  const setLatestToastRef = useRef(setLatestToast);
  const setSyncFingerprintRef = useRef(setSyncFingerprint);

  useEffect(() => {
    queryClientRef.current = queryClient;
    setLatestToastRef.current = setLatestToast;
    setSyncFingerprintRef.current = setSyncFingerprint;
  }, [queryClient, setLatestToast, setSyncFingerprint]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;

    const poll = async () => {
      if (cancelled || inFlight || AppState.currentState !== 'active') return;
      inFlight = true;
      try {
        const { data } = await api.get<SyncResponse>('/mobile/announcements/sync', {
          timeout: 8000,
        });
        if (cancelled || !data?.fingerprint) return;

        const prevFingerprint = fingerprintRef.current;
        const nextFingerprint = data.fingerprint;
        const items = data.items || [];

        if (!primedRef.current) {
          primedRef.current = true;
          fingerprintRef.current = nextFingerprint;
          setSyncFingerprintRef.current(nextFingerprint);
          knownUpdatedRef.current = new Map(
            items.map((item) => [item.id, String(item.updated_at || item.created_at || '')]),
          );
          return;
        }

        if (prevFingerprint === nextFingerprint) return;

        fingerprintRef.current = nextFingerprint;
        setSyncFingerprintRef.current(nextFingerprint);

        let changed: SyncItem | null = null;
        let action: 'published' | 'updated' = 'updated';

        for (const item of items) {
          const prevUpdated = knownUpdatedRef.current.get(item.id);
          const nextUpdated = String(item.updated_at || item.created_at || '');
          if (!prevUpdated) {
            changed = item;
            action = 'published';
            break;
          }
          if (prevUpdated !== nextUpdated) {
            changed = item;
            action = 'updated';
            break;
          }
        }

        knownUpdatedRef.current = new Map(
          items.map((item) => [item.id, String(item.updated_at || item.created_at || '')]),
        );

        await queryClientRef.current.invalidateQueries({ queryKey: ['announcements'] });
        await queryClientRef.current.invalidateQueries({ queryKey: ['announcement'] });

        if (changed) {
          const toastTitle =
            action === 'published' ? 'New Club Announcement' : 'Announcement Updated';
          setLatestToastRef.current({
            id: changed.id,
            title: changed.title,
            message: toastTitle,
          });
          void showLocalAnnouncementNotice(
            toastTitle,
            changed.title || changed.short_description || 'Tap to view',
            changed.id,
          );
        }
      } catch {
        // Ignore transient network errors while syncing.
      } finally {
        inFlight = false;
      }
    };

    // Check immediately, on foreground, and while the member is active.
    void poll();
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void poll();
    };
    const sub = AppState.addEventListener('change', onAppState);
    const interval = setInterval(() => void poll(), SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      sub.remove();
      clearInterval(interval);
    };
  }, [enabled]);
}

export default useAnnouncementRealtime;
