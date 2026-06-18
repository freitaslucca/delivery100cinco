import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.isProd ? 'info' : 'debug',
  transport: config.isProd
    ? undefined
    : {
        target: 'pino/file',
        options: { destination: 1 },
      },
  redact: {
    paths: ['req.headers.authorization', 'password', '*.password', '*.passwordHash'],
    censor: '[REDACTED]',
  },
});
