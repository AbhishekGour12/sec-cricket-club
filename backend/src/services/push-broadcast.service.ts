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

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;
const FCM_MULTICAST_SIZE = 500;

const isExpoPushToken = (token: string) =>
  token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken');

function buildExpoMessage(token: string, payload: PushPayload) {
  if (payload.silent) {
    return {
      to: token,
      data: payload.data ?? {},
      priority: 'high',
      contentAvailable: true,
      _contentAvailable: true,
    };
  }

  return {
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
  };
}

export async function sendExpoPushBatch(tokens: string[], payload: PushPayload): Promise<void> {
  if (tokens.length === 0) return;

  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const chunk = tokens.slice(i, i + EXPO_BATCH_SIZE);
    const messages = chunk.map((token) => buildExpoMessage(token, payload));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Expo push batch failed: ${response.status} ${text}`);
    }
  }
}

export async function sendFcmMulticast(tokens: string[], payload: PushPayload): Promise<void> {
  if (tokens.length === 0) return;
  if (!admin.apps.length) {
    logger.warn('[Notification] Firebase Admin not initialised — skipping FCM multicast.');
    return;
  }

  for (let i = 0; i < tokens.length; i += FCM_MULTICAST_SIZE) {
    const chunk = tokens.slice(i, i + FCM_MULTICAST_SIZE);

    if (payload.silent) {
      await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        data: payload.data ?? {},
        android: { priority: 'high' },
        apns: {
          headers: { 'apns-priority': '5', 'apns-push-type': 'background' },
          payload: { aps: { 'content-available': 1 } },
        },
      });
      continue;
    }

    await admin.messaging().sendEachForMulticast({
      tokens: chunk,
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
    });
  }
}

export async function broadcastPushTokens(
  tokens: string[],
  payload: PushPayload,
): Promise<number> {
  const unique = Array.from(new Set(tokens.filter(Boolean)));
  if (unique.length === 0) return 0;

  const expoTokens = unique.filter(isExpoPushToken);
  const fcmTokens = unique.filter((token) => !isExpoPushToken(token));

  await Promise.all([
    sendExpoPushBatch(expoTokens, payload),
    sendFcmMulticast(fcmTokens, payload),
  ]);

  return unique.length;
}

export async function loadApprovedMemberPushTokens(): Promise<string[]> {
  const members = await User.findAll({
    where: {
      approval_status: 'approved',
      status: 'active',
      fcm_token: { [Op.ne]: null as any },
    },
    attributes: ['fcm_token'],
    raw: true,
  });

  return members
    .map((row) => String((row as { fcm_token?: string }).fcm_token || ''))
    .filter(Boolean);
}
