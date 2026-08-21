import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { connectRealtimeStream, type RealtimePayload } from '../services/realtimeStream';
import { useAnnouncementStore } from '../store/announcementStore';
import { useEventStore } from '../store/eventStore';
import { useRealtimeStore } from '../store/realtimeStore';
import { refreshPublishedContent } from '../utils/refreshContent';

const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

async function showLocalNotice(title: string, body: string, channel: 'announcements' | 'events', data: Record<string, string>) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(channel, {
        name: channel === 'events' ? 'Events' : 'Announcements',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        color: '#1A2744',
      },
      trigger: null,
    });
  } catch {
    // best-effort
  }
}

/**
 * SSE realtime stream — instant updates when admin publishes announcements/events.
 * Falls back to polling hooks when disconnected.
 */
export function useRealtimeStream(enabled: boolean) {
  const queryClient = useQueryClient();
  const setLatestAnnouncementToast = useAnnouncementStore((s) => s.setLatestToast);
  const setLatestEventToast = useEventStore((s) => s.setLatestToast);
  const setStreamConnected = useRealtimeStore((s) => s.setStreamConnected);

  const queryClientRef = useRef(queryClient);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionRef = useRef<{ close: () => void } | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) {
      setStreamConnected(false);
      return;
    }

    let cancelled = false;

    const handlePayload = async (payload: RealtimePayload) => {
      if (payload.action === 'unpublished') {
        await refreshPublishedContent(queryClientRef.current);
        if (payload.channel === 'announcement' && payload.id) {
          queryClientRef.current.removeQueries({ queryKey: ['announcement', payload.id] });
        }
        if (payload.channel === 'event' && payload.id) {
          queryClientRef.current.removeQueries({ queryKey: ['event', payload.id] });
        }
        return;
      }

      await refreshPublishedContent(queryClientRef.current);

      if (payload.channel === 'members') {
        await queryClientRef.current.refetchQueries({ queryKey: ['members'] });
        await queryClientRef.current.refetchQueries({ queryKey: ['categories'] });
        return;
      }

      if (payload.channel === 'announcement' && payload.id) {
        const toastTitle = payload.message || 'New Club Announcement';
        setLatestAnnouncementToast({
          id: payload.id,
          title: payload.title || 'Club announcement',
          message: toastTitle,
        });
        void showLocalNotice(toastTitle, payload.title || 'Tap to view', 'announcements', {
          type: 'announcement',
          announcementId: String(payload.id),
          action: payload.action,
        });
        return;
      }

      if (payload.channel === 'event' && payload.id) {
        const toastTitle = payload.message || 'New Club Event';
        setLatestEventToast({
          id: payload.id,
          title: payload.title || 'Club event',
          message: toastTitle,
        });
        void showLocalNotice(toastTitle, payload.title || 'Tap to view', 'events', {
          type: 'event',
          eventId: String(payload.id),
          action: payload.action,
        });
      }
    };

    const scheduleReconnect = () => {
      if (cancelled || connectingRef.current) return;
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (cancelled || connectingRef.current) return;
      connectingRef.current = true;

      connectionRef.current?.close();
      connectionRef.current = null;

      try {
        const connection = await connectRealtimeStream(
          (_event, raw) => {
            if (cancelled) return;
            void handlePayload(raw);
          },
          (connected) => {
            setStreamConnected(connected);
            if (connected) {
              reconnectAttemptRef.current = 0;
            }
          },
          () => {
            if (!cancelled) {
              scheduleReconnect();
            }
          },
        );

        if (cancelled) {
          connection?.close();
          return;
        }

        if (!connection) {
          setStreamConnected(false);
          scheduleReconnect();
          return;
        }

        connectionRef.current = connection;
      } finally {
        connectingRef.current = false;
      }
    };

    void connect();

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && !cancelled) {
        reconnectAttemptRef.current = 0;
        void connect();
      }
    };

    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      sub.remove();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      connectionRef.current?.close();
      connectionRef.current = null;
      setStreamConnected(false);
    };
  }, [enabled, setLatestAnnouncementToast, setLatestEventToast, setStreamConnected]);
}

export default useRealtimeStream;
