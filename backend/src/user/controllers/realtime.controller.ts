import { Response } from 'express';
import User from '../models/User';
import { verifyToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { realtimeHub } from '../../services/realtime-hub.service';

function extractBearerToken(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  const queryToken = req.query?.token;
  if (typeof queryToken === 'string' && queryToken.trim()) {
    return queryToken.trim();
  }

  return null;
}

export class RealtimeController {
  /**
   * GET /api/realtime/stream
   * Server-Sent Events stream for instant announcement/event/member updates.
   */
  public static async stream(req: any, res: Response): Promise<void> {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
      return;
    }

    let userId: number;
    try {
      const decoded = verifyToken(token);
      userId = decoded.id;
    } catch {
      res.status(401).json({ error: 'Unauthorized', message: 'Access token is invalid or expired' });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'approval_status', 'status'],
    });

    if (!user || user.approval_status !== 'approved' || user.status !== 'active') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Realtime updates are available to approved active members only.',
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

    const clientId = realtimeHub.subscribe(userId, res);

    req.on('close', () => {
      realtimeHub.unsubscribe(clientId);
    });

    req.on('error', (err: Error) => {
      logger.warn(`[Realtime] Stream error for ${clientId}:`, err.message);
      realtimeHub.unsubscribe(clientId);
    });
  }
}

export default RealtimeController;
