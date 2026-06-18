import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/app.js';
import { connectDB } from '../server/lib/db.js';

/**
 * Entrada Vercel Serverless — único handler pra TODA a API.
 *
 * Roteamento:
 * O vercel.json tem um rewrite "/api/(.*) → /api/index?_vp=$1" que captura
 * o resto do path em "$1" e injeta como query param "_vp". Aqui dentro a
 * gente reconstrói o req.url com o path original, então o Express continua
 * com routing normal (mesmo código que roda local).
 *
 * Por que esse rodeio? Catch-all filenames como [...path].ts e
 * [[...path]].ts só matcheam 1 segmento de profundidade na Vercel, então
 * /api/orders/stats/today retorna NOT_FOUND. Rewrite com capture group +
 * query param é a única abordagem que cobre profundidade arbitrária.
 */

type Handler = (req: VercelRequest, res: VercelResponse) => void;
let appPromise: Promise<Handler> | null = null;

async function getApp(): Promise<Handler> {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDB();
      return buildApp() as unknown as Handler;
    })().catch((err) => {
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Reconstrói req.url a partir do _vp injetado pelo rewrite
  const q = req.query as Record<string, string | string[] | undefined>;
  const vp = q._vp;
  if (vp !== undefined) {
    const pathPart = Array.isArray(vp) ? vp.join('/') : vp;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (k === '_vp' || v === undefined) continue;
      if (Array.isArray(v)) v.forEach((val) => params.append(k, val));
      else params.append(k, v);
    }
    const qs = params.toString();
    req.url = '/api/' + pathPart + (qs ? '?' + qs : '');
  }

  console.log(`[${req.method}] ${req.url}`);

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
