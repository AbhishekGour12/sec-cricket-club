import { router } from 'expo-router';

export type PushNotificationData = {
  type?: string;
  action?: string;
  announcementId?: string;
  eventId?: string;
};

export function navigateFromPushData(data?: PushNotificationData | Record<string, string> | null): boolean {
  if (!data) return false;

  if (data.type === 'announcement' && data.announcementId) {
    router.push(`/announcement/${data.announcementId}` as any);
    return true;
  }

  if (data.type === 'event' && data.eventId) {
    router.push(`/event/${data.eventId}` as any);
    return true;
  }

  return false;
}
