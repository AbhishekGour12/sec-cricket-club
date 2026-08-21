import api from './api';
import { SecureStorageService } from './secureStore';

export interface RealtimePayload {
  channel: 'announcement' | 'event' | 'members';
  action: 'published' | 'updated' | 'unpublished' | 'refresh';
  id?: number;
  title?: string;
  message?: string;
  fingerprint?: string;
}

type MessageHandler = (event: string, payload: RealtimePayload) => void;

function getStreamUrl(): string {
  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  return `${base}/realtime/stream`;
}

function parseSseChunk(buffer: string): { events: Array<{ event: string; data: string }>; rest: string } {
  const events: Array<{ event: string; data: string }> = [];
  const parts = buffer.split('\n\n');

  for (let i = 0; i < parts.length - 1; i += 1) {
    const block = parts[i].trim();
    if (!block || block.startsWith(':')) continue;

    let event = 'message';
    const dataLines: string[] = [];

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join('\n') });
    }
  }

  return { events, rest: parts[parts.length - 1] || '' };
}

export interface RealtimeStreamConnection {
  close: () => void;
}

/**
 * React Native–friendly SSE client using XMLHttpRequest streaming.
 */
export async function connectRealtimeStream(
  onMessage: MessageHandler,
  onStatusChange?: (connected: boolean) => void,
  onDisconnect?: () => void,
): Promise<RealtimeStreamConnection | null> {
  const token = await SecureStorageService.getToken();
  if (!token) return null;

  const xhr = new XMLHttpRequest();
  let buffer = '';
  let lastIndex = 0;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    xhr.abort();
    onStatusChange?.(false);
    onDisconnect?.();
  };

  xhr.open('GET', getStreamUrl());
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.setRequestHeader('Accept', 'text/event-stream');
  xhr.setRequestHeader('Cache-Control', 'no-cache');

  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
      if (xhr.status >= 200 && xhr.status < 300) {
        onStatusChange?.(true);
      } else {
        close();
      }
    }
  };

  xhr.onprogress = () => {
    if (closed) return;
    const chunk = xhr.responseText.slice(lastIndex);
    lastIndex = xhr.responseText.length;
    if (!chunk) return;

    buffer += chunk;
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;

    for (const item of parsed.events) {
      if (item.event === 'connected') continue;
      try {
        const payload = JSON.parse(item.data) as RealtimePayload;
        onMessage(item.event, payload);
      } catch {
        // ignore malformed frames
      }
    }
  };

  xhr.onerror = () => close();
  xhr.onloadend = () => close();

  xhr.send();

  return { close };
}
