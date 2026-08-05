import admin from '../config/firebase';
import { logger } from '../utils/logger';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification to a single FCM token.
 * Silently skips if Firebase Admin is not initialised or token is missing.
 */
export async function sendPushNotification(fcmToken: string | null | undefined, payload: PushPayload): Promise<void> {
  if (!fcmToken) return;

  // Firebase Admin app is only initialised when valid credentials exist
  if (!admin.apps.length) {
    logger.warn('[Notification] Firebase Admin not initialised — skipping push.');
    return;
  }

  try {
    const message: admin.messaging.Message = {
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
          channelId: 'default',
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
    logger.info(`[Notification] Push sent — messageId: ${response}`);
  } catch (err: any) {
    // Log but never crash the caller — notification failure must not affect the API response
    logger.error('[Notification] Failed to send push notification:', err?.message ?? err);
  }
}
