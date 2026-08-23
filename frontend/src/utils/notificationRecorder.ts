import { useNotificationInboxStore } from '@/store/notificationInboxStore';
import type { PushNotificationData } from '@/utils/notificationNavigation';

export function recordInboxNotification(
  data: PushNotificationData | Record<string, string> | undefined,
  title: string,
  body: string,
): void {
  if (!data || data.action === 'unpublished') return;

  if (data.type === 'announcement' && data.announcementId) {
    useNotificationInboxStore.getState().addNotification({
      type: 'announcement',
      title,
      body,
      contentId: Number(data.announcementId),
      action: (data.action as 'published' | 'updated') || 'published',
    });
    return;
  }

  if (data.type === 'event' && data.eventId) {
    useNotificationInboxStore.getState().addNotification({
      type: 'event',
      title,
      body,
      contentId: Number(data.eventId),
      action: (data.action as 'published' | 'updated') || 'published',
    });
  }
}
