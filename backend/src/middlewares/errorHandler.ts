import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

import multer from 'multer';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err instanceof multer.MulterError || (err as any).name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the allowed limit (maximum 10MB). Please select a smaller file.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded at once. Please upload within the allowed file count.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field in upload request.';
    } else {
      message = `Upload Error: ${err.message}`;
    }
  } else if (err.message && (err.message.includes('Invalid image format') || err.message.includes('Invalid file format') || err.message.includes('Only jpg'))) {
    statusCode = 400;
  }

  // Log error with context
  logger.error(`${req.method} ${req.url} - Error: ${message}`, err);

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      message,
      code: err.code,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      ...(err.details && { details: err.details }),
    },
  });
};
