import admin from '../config/firebase';
import { logger } from '../utils/logger';
import User from '../user/models/User';
import { Op } from 'sequelize';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Data-only: refresh client caches without showing a banner. */
  silent?: boolean;
}

const isExpoPushToken = (token: string) =>
  token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken');

async function sendExpoPushNotification(token: string, payload: PushPayload): Promise<void> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      payload.silent
        ? {
            to: token,
            data: payload.data ?? {},
            priority: 'high',
            contentAvailable: true,
            _contentAvailable: true,
          }
        : {
            to: token,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data ?? {},
            priority: 'high',
            channelId:
              payload.data?.type === 'event'
                ? 'events'
                : payload.data?.type === 'announcement'
                  ? 'announcements'
                  : 'default',
          },
    ),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push failed: ${response.status} ${text}`);
  }
}

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
      await sendExpoPushNotification(fcmToken, payload);
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
  const members = await User.findAll({
    where: {
      approval_status: 'approved',
      status: 'active',
      fcm_token: { [Op.ne]: null as any },
    },
    attributes: ['id', 'fcm_token'],
  });

  let sent = 0;
  await Promise.all(
    members.map(async (member) => {
      if (!member.fcm_token) return;
      await sendPushNotification(member.fcm_token, payload);
      sent += 1;
    }),
  );

  logger.info(`[Notification] Broadcast to ${sent} approved members — ${payload.title}`);
  return sent;
}
