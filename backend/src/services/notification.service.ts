import admin from '../config/firebase';
import { logger } from '../utils/logger';
import {
  broadcastPushTokens,
  loadApprovedMemberPushTokens,
  sendExpoPushBatch,
  type PushPayload,
} from './push-broadcast.service';

export type { PushPayload };

const isExpoPushToken = (token: string) =>
  token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken');

/**
 * Send a push notification to a single FCM / Expo push token.
 * Silently skips if token is missing.
 */
export async function sendPushNotification(
  fcmToken: string | null | undefined,
  payload: PushPayload,
): Promise<void> {
  if (!fcmToken) return;

  try {
    if (isExpoPushToken(fcmToken)) {
      await sendExpoPushBatch([fcmToken], payload);
      logger.info('[Notification] Expo push sent');
      return;
    }

    if (!admin.apps.length) {
      logger.warn('[Notification] Firebase Admin not initialised — skipping FCM push.');
      return;
    }

    const message: admin.messaging.Message = payload.silent
      ? {
          token: fcmToken,
          data: payload.data ?? {},
          android: { priority: 'high' },
          apns: {
            headers: { 'apns-priority': '5', 'apns-push-type': 'background' },
            payload: { aps: { 'content-available': 1 } },
          },
        }
      : {
          token: fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data ?? {},
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId:
                payload.data?.type === 'event'
                  ? 'events'
                  : payload.data?.type === 'announcement'
                    ? 'announcements'
                    : 'default',
              icon: 'notification_icon',
              color: '#1A2744',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

    const response = await admin.messaging().send(message);
    logger.info(`[Notification] FCM push sent — messageId: ${response}`);
  } catch (err: any) {
    logger.error('[Notification] Failed to send push notification:', err?.message ?? err);
  }
}

/**
 * Broadcast a push to all approved + active members that have a push token.
 */
export async function broadcastToApprovedMembers(payload: PushPayload): Promise<number> {
  const tokens = await loadApprovedMemberPushTokens();
  const sent = await broadcastPushTokens(tokens, payload);
  logger.info(`[Notification] Broadcast to ${sent} approved members — ${payload.title}`);
  return sent;
}
