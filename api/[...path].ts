import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { buildApp } from '../server/app.js';
import { connectDB } from '../server/lib/db.js';

/**
 * Entrada Vercel Serverless (catch-all).
 * O filename [...path].ts faz a Vercel rotear automaticamente todos os
 * /api/* pra cá, preservando o req.url original (sem rewrite).
 * - Conecta no Mongo uma vez por container (cache no globalThis)
 * - serverless-http traduz req/res da Vercel pro Express
 */

let handlerPromise: Promise<ReturnType<typeof serverless>> | null = null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      await connectDB();
      return serverless(buildApp());
    })();
  }
  return handlerPromise;
}

export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  try {
    const handler = await getHandler();
    return handler(req, res);
  } catch (err) {
    console.error('Handler bootstrap error:', err);
    res.status(500).json({ error: 'Falha ao iniciar o servidor' });
  }
}
