import { Customer } from '../models/Customer.js';
import type { OrderStatus } from '../models/Order.js';
import { logger } from './logger.js';

interface CustomerData {
  fullName: string;
  phone: string;
  cep?: string;
  address: string;
  number: string;
  complement?: string;
  city: string;
}

/**
 * Faz upsert do cliente quando chega um pedido novo.
 * - Identifica por telefone (só dígitos pra deduplicar formatação diferente)
 * - Acrescenta o endereço se for novo, ou incrementa timesUsed se já existir
 * - Incrementa contadores de pedidos e gasto total
 */
export async function upsertCustomerFromOrder(
  data: CustomerData,
  total: number
): Promise<void> {
  const phoneDigits = data.phone.replace(/\D/g, '');
  if (!phoneDigits) return;

  try {
    const existing = await Customer.findOne({ phoneDigits });
    const now = new Date();
    const addressKey = `${data.address}|${data.number}|${data.city}`.toLowerCase();

    if (existing) {
      // Atualiza dados
      existing.fullName = data.fullName;
      existing.totalOrders = (existing.totalOrders ?? 0) + 1;
      existing.totalSpent = Number(((existing.totalSpent ?? 0) + total).toFixed(2));
      existing.lastOrderAt = now;

      // Endereço: incrementa timesUsed se já tem, senão adiciona
      const addrIdx = (existing.addresses ?? []).findIndex(
        (a) => `${a.address}|${a.number}|${a.city}`.toLowerCase() === addressKey
      );
      if (addrIdx >= 0) {
        existing.addresses![addrIdx].timesUsed = (existing.addresses![addrIdx].timesUsed ?? 1) + 1;
        existing.addresses![addrIdx].lastUsedAt = now;
      } else {
        existing.addresses!.push({
          cep: data.cep ?? '',
          address: data.address,
          number: data.number,
          complement: data.complement ?? '',
          city: data.city,
          timesUsed: 1,
          lastUsedAt: now,
        });
      }
      await existing.save();
    } else {
      await Customer.create({
        phone: data.phone,
        phoneDigits,
        fullName: data.fullName,
        addresses: [
          {
            cep: data.cep ?? '',
            address: data.address,
            number: data.number,
            complement: data.complement ?? '',
            city: data.city,
            timesUsed: 1,
            lastUsedAt: now,
          },
        ],
        totalOrders: 1,
        totalSpent: Number(total.toFixed(2)),
        firstOrderAt: now,
        lastOrderAt: now,
      });
    }
  } catch (err) {
    logger.error({ err, phone: phoneDigits }, 'Falha ao salvar cliente');
  }
}

/**
 * Quando um pedido é cancelado, incrementa o contador e subtrai do totalSpent.
 */
export async function applyOrderCancellation(phone: string, total: number): Promise<void> {
  const phoneDigits = phone.replace(/\D/g, '');
  if (!phoneDigits) return;
  try {
    await Customer.updateOne(
      { phoneDigits },
      {
        $inc: { cancelledOrders: 1, totalSpent: -total },
      }
    );
  } catch (err) {
    logger.error({ err, phone: phoneDigits }, 'Falha ao registrar cancelamento no cliente');
  }
}

export function statusAffectsRevenue(status: OrderStatus): boolean {
  return status !== 'cancelado';
}
