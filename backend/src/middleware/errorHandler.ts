import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';
import { ErrorResponse } from '../types';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message}`);
    const body: ErrorResponse = {
      error: err.message,
      code: err.code,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected errors
  logger.error('Unhandled error:', err);
  const body: ErrorResponse = {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  };
  res.status(500).json(body);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
