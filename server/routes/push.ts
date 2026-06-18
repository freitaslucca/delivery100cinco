import { Router } from 'express';
import { config } from '../config.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { subscribeSchema, unsubscribeSchema, type SubscribeInput, type UnsubscribeInput } from '../schemas/push.js';
import { validate, getValidated } from '../middleware/validate.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { sendPushToAllAdmins, isPushConfigured } from '../lib/webpush.js';
import { logger } from '../lib/logger.js';

export const pushRouter = Router();

pushRouter.get('/public-key', (_req, res) => {
  if (!config.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push não configurado no servidor' });
  }
  res.json({ publicKey: config.VAPID_PUBLIC_KEY, enabled: isPushConfigured() });
});

pushRouter.post(
  '/subscribe',
  authRequired,
  validate(subscribeSchema),
  async (req: AuthRequest, res) => {
    const data = getValidated<SubscribeInput>(req);
    const adminId = req.user!.sub;

    await PushSubscription.findOneAndUpdate(
      { endpoint: data.endpoint },
      {
        adminId,
        endpoint: data.endpoint,
        keys: data.keys,
        userAgent: data.userAgent ?? '',
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info({ adminId, ua: data.userAgent }, '🔔 Push subscription registrada');
    res.json({ ok: true });
  }
);

pushRouter.post(
  '/unsubscribe',
  authRequired,
  validate(unsubscribeSchema),
  async (req, res) => {
    const { endpoint } = getValidated<UnsubscribeInput>(req);
    await PushSubscription.deleteOne({ endpoint });
    res.json({ ok: true });
  }
);

pushRouter.post('/test', authRequired, async (_req, res) => {
  await sendPushToAllAdmins({
    title: '🧪 Teste de Notificação',
    body: 'Funcionou! Você vai receber notificações de novos pedidos.',
    url: '/pedidos.html',
    tag: 'test',
    requireInteraction: false,
  });
  res.json({ ok: true });
});
