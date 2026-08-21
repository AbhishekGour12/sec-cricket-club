import { Response } from 'express';
import { logger } from '../utils/logger';

export type RealtimeChannel = 'announcement' | 'event' | 'members';

export type RealtimeAction = 'published' | 'updated' | 'unpublished' | 'refresh';

export interface RealtimePayload {
  channel: RealtimeChannel;
  action: RealtimeAction;
  id?: number;
  title?: string;
  message?: string;
  fingerprint?: string;
}

interface StreamClient {
  id: string;
  userId: number;
  res: Response;
  heartbeat: NodeJS.Timeout;
}

const HEARTBEAT_MS = 25_000;

class RealtimeHub {
  private clients = new Map<string, StreamClient>();
  private clientCounter = 0;

  subscribe(userId: number, res: Response): string {
    const id = `sse_${userId}_${++this.clientCounter}`;

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        this.unsubscribe(id);
      }
    }, HEARTBEAT_MS);

    this.clients.set(id, { id, userId, res, heartbeat });
    logger.info(`[Realtime] Client connected (${id}). Active: ${this.clients.size}`);
    return id;
  }

  unsubscribe(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    clearInterval(client.heartbeat);
    this.clients.delete(clientId);

    try {
      if (!client.res.writableEnded) {
        client.res.end();
      }
    } catch {
      // ignore
    }

    logger.info(`[Realtime] Client disconnected (${clientId}). Active: ${this.clients.size}`);
  }

  broadcast(payload: RealtimePayload): void {
    const data = JSON.stringify(payload);
    const frame = `event: ${payload.channel}\ndata: ${data}\n\n`;
    let delivered = 0;

    for (const [clientId, client] of this.clients) {
      try {
        client.res.write(frame);
        delivered += 1;
      } catch (err) {
        logger.warn(`[Realtime] Failed to write to ${clientId}:`, err);
        this.unsubscribe(clientId);
      }
    }

    logger.info(
      `[Realtime] Broadcast ${payload.channel}:${payload.action} to ${delivered}/${this.clients.size} clients`,
    );
  }

  activeConnections(): number {
    return this.clients.size;
  }
}

export const realtimeHub = new RealtimeHub();

export function publishRealtimeUpdate(payload: RealtimePayload): void {
  realtimeHub.broadcast(payload);
}
