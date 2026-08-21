import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useAnnouncementStore } from '../store/announcementStore';
import { useEventStore } from '../store/eventStore';
import { useQueryClient } from '@tanstack/react-query';

try {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const action = (notification.request.content.data as { action?: string } | undefined)?.action;
      const silent = action === 'unpublished';
      return {
        shouldShowBanner: !silent,
        shouldShowList: !silent,
        shouldPlaySound: !silent,
        shouldSetBadge: !silent,
      };
    },
  });
} catch {
  // Handler setup can fail in some runtimes — ignore.
}

async function registerForPushAsync(): Promise<string | null> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync('events', {
        name: 'Events',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    // Expo tokens work on both iOS (APNs) and Android (FCM). Native APNs
    // device tokens cannot be sent through Firebase Admin messaging.
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResponse.data || null;
  } catch (err) {
    // Common in local/dev when Expo push registration fetch is canceled.
    console.warn('[Push] Token registration unavailable:', err);
    return null;
  }
}

/**
 * Registers the device for push notifications and listens for announcement pushes.
 * Safe no-op when the user is logged out or permissions are denied.
 */
export function usePushNotifications(enabled: boolean) {
  const queryClient = useQueryClient();
  const setAnnouncementToast = useAnnouncementStore((s) => s.setLatestToast);
  const setEventToast = useEventStore((s) => s.setLatestToast);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let foregroundSub: Notifications.EventSubscription | undefined;
    let responseSub: Notifications.EventSubscription | undefined;
    let cancelled = false;

    const setup = async () => {
      try {
        if (!registeredRef.current) {
          const token = await registerForPushAsync();
          if (!cancelled && token && useAuthStore.getState().isAuthenticated) {
            try {
              await api.post('/me/fcm-token', { fcm_token: token }, { timeout: 15000 });
              registeredRef.current = true;
            } catch (err) {
              console.warn('[Push] Failed to save token to API:', err);
            }
          }
        }
      } catch (err) {
        console.warn('[Push] Registration skipped:', err);
      }

      if (cancelled) return;

      foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as Record<string, string> | undefined;
        const unpublished = data?.action === 'unpublished';

        if (data?.type === 'announcement') {
          const id = data.announcementId ? Number(data.announcementId) : 0;
          if (!unpublished) {
            const title =
              notification.request.content.title ||
              notification.request.content.body ||
              'New announcement';
            setAnnouncementToast({
              title: String(notification.request.content.body || title),
              id,
              message: String(title),
            });
          }
          queryClient.invalidateQueries({ queryKey: ['announcements'] });
          queryClient.invalidateQueries({ queryKey: ['announcement'] });
          if (unpublished && id) {
            queryClient.removeQueries({ queryKey: ['announcement', id] });
          }
        }

        if (data?.type === 'event') {
          const id = data.eventId ? Number(data.eventId) : 0;
          if (!unpublished) {
            const title =
              notification.request.content.title ||
              notification.request.content.body ||
              'New Club Event';
            setEventToast({
              title: String(notification.request.content.body || title),
              id,
              message: String(title),
            });
          }
          queryClient.invalidateQueries({ queryKey: ['events'] });
          queryClient.invalidateQueries({ queryKey: ['event'] });
          if (unpublished && id) {
            queryClient.removeQueries({ queryKey: ['event', id] });
          }
        }
      });

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, string>
          | undefined;
        if (data?.type === 'event') {
          queryClient.invalidateQueries({ queryKey: ['events'] });
          queryClient.invalidateQueries({ queryKey: ['event'] });
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        queryClient.invalidateQueries({ queryKey: ['announcement'] });
      });
    };

    void setup();

    return () => {
      cancelled = true;
      foregroundSub?.remove();
      responseSub?.remove();
    };
  }, [enabled, queryClient, setAnnouncementToast, setEventToast]);
}

export default usePushNotifications;
