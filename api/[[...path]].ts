import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/app.js';
import { connectDB } from '../server/lib/db.js';

/**
 * Entrada Vercel Serverless (catch-all).
 *
 * O filename [...path].ts faz a Vercel rotear todos os /api/* pra cá,
 * preservando o req.url original.
 *
 * Passamos o req/res direto pro Express (sem serverless-http). A Vercel
 * implementa http.IncomingMessage e http.ServerResponse no req/res, que é
 * exatamente o que o Express espera. Isso evita a camada de adaptação que
 * estava deixando a função "viva" depois da resposta e batendo no timeout
 * de 30s da Vercel.
 */

type Handler = (req: VercelRequest, res: VercelResponse) => void;
let appPromise: Promise<Handler> | null = null;

async function getApp(): Promise<Handler> {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDB();
      return buildApp() as unknown as Handler;
    })().catch((err) => {
      appPromise = null; // permite retry no próximo invocation
      throw err;
    });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log diagnóstico (aparece em Vercel Logs)
  console.log(`[${req.method}] ${req.url}`);

  // Defesa: garante que o req.url chega no Express com o prefixo /api.
  // O catch-all costuma preservar a URL original, mas dependendo da
  // versão do runtime ela pode vir só com a parte capturada (/auth/login
  // em vez de /api/auth/login).
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }

  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    const e = err as Error;
    console.error('Bootstrap error:', e.message, e.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Falha ao iniciar', message: e.message });
    }
  }
}
