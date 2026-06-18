import webpush from 'web-push';
import { config } from '../config.js';
import { logger } from './logger.js';
import { PushSubscription } from '../models/PushSubscription.js';

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!config.VAPID_PUBLIC_KEY || !config.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    config.VAPID_CONTACT,
    config.VAPID_PUBLIC_KEY,
    config.VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

/**
 * Envia push pra TODAS as subscriptions ativas (todos os admins logados em
 * qualquer dispositivo). Remove subscriptions com 410 Gone (expiradas).
 */
export async function sendPushToAllAdmins(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) {
    logger.debug('VAPID não configurado — pulando push');
    return;
  }

  const subs = await PushSubscription.find().lean();
  if (subs.length === 0) return;
  const validSubs = subs.filter((s) => s.keys?.p256dh && s.keys?.auth);
  if (validSubs.length === 0) return;

  const payloadString = JSON.stringify(payload);

  const results = await Promise.allSettled(
    validSubs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys!.p256dh, auth: sub.keys!.auth },
        },
        payloadString,
        { TTL: 60 * 60 * 24, urgency: 'high' }
      )
    )
  );

  const deadEndpoints: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const err = r.reason as { statusCode?: number; message?: string };
      if (err.statusCode === 404 || err.statusCode === 410) {
        deadEndpoints.push(validSubs[i].endpoint);
      } else {
        logger.warn({ err: err.message, sc: err.statusCode }, 'Push falhou');
      }
    }
  });

  if (deadEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: deadEndpoints } });
    logger.info({ removed: deadEndpoints.length }, 'Subscriptions expiradas removidas');
  }
}

export function isPushConfigured(): boolean {
  return ensureConfigured();
}
