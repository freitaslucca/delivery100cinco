import mongoose from 'mongoose';
import { config } from '../config.js';
import { logger } from './logger.js';

/**
 * Cache da conexão entre invocações da serverless function.
 * Em ambientes serverless (Vercel), o módulo é mantido em memória
 * enquanto o container estiver "warm" — então cacheamos a Promise
 * pra reutilizar a conexão e nunca abrir 2 ao mesmo tempo durante
 * o cold start.
 */
interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongo = globalThis as unknown as { __mongoCache?: MongoCache };
const cache: MongoCache = globalForMongo.__mongoCache ?? { conn: null, promise: null };
if (!globalForMongo.__mongoCache) globalForMongo.__mongoCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn && cache.conn.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose
      .connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 10_000,
        autoIndex: !config.isProd,
        bufferCommands: false,
        maxPoolSize: 5,
      })
      .then((m) => {
        logger.info({ host: m.connection.host, db: m.connection.name }, '🗄️  MongoDB conectado');
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        logger.error({ err }, 'Falha ao conectar no MongoDB');
        throw err;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB desconectado');
  cache.conn = null;
  cache.promise = null;
});
