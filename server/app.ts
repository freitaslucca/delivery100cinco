import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';

import { config } from './config.js';
import { logger } from './lib/logger.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { pushRouter } from './routes/push.js';
import { customersRouter } from './routes/customers.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// __dirname é "server/" em dev (tsx) e "dist/server/" em prod. Em ambos os casos,
// a raiz do projeto fica 1 nível acima (server/..) ou 2 níveis (dist/server/..).
const ROOT_DIR = __dirname.includes(`${path.sep}dist${path.sep}`)
  ? path.resolve(__dirname, '../..')
  : path.resolve(__dirname, '..');

export function buildApp(): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: config.corsOrigins === '*' ? true : config.corsOrigins,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: true, limit: '512kb' }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/customers', customersRouter);

  if (config.SERVE_STATIC) {
    app.use(
      express.static(ROOT_DIR, {
        index: 'index.html',
        extensions: ['html'],
        maxAge: config.isProd ? '1h' : 0,
      })
    );

    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(ROOT_DIR, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
