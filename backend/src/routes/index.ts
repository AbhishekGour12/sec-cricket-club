import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health Check Endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API Root Information Endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the SEC Cricket Club API Service',
    version: '1.0.0',
    status: 'active',
  });
});

export default router;
