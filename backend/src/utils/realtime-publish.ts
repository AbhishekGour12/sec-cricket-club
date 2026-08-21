import { publishRealtimeUpdate, type RealtimeAction, type RealtimeChannel } from '../services/realtime-hub.service';

export function emitContentUpdate(
  channel: RealtimeChannel,
  action: RealtimeAction,
  details: { id?: number; title?: string; message?: string; fingerprint?: string } = {},
): void {
  publishRealtimeUpdate({
    channel,
    action,
    id: details.id,
    title: details.title,
    message: details.message,
    fingerprint: details.fingerprint,
  });
}
