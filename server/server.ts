import { createServer } from 'node:http';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { connectDB } from './lib/db.js';
import { buildApp } from './app.js';

async function bootstrap(): Promise<void> {
  await connectDB();
  const app = buildApp();
  const httpServer = createServer(app);

  httpServer.listen(config.PORT, () => {
    logger.info(
      { port: config.PORT, env: config.NODE_ENV, serveStatic: config.SERVE_STATIC },
      `🚀 Servidor 100 Cinco rodando em http://localhost:${config.PORT}`
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Encerrando servidor...');
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Falha no bootstrap');
  process.exit(1);
});
