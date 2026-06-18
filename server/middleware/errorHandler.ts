import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Rota não encontrada' });
    return;
  }
  next();
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err, path: req.path }, 'Erro não tratado');
  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV !== 'production' && { message: err.message }),
  });
}
