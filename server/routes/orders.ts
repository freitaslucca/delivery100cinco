import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Order, ORDER_STATUSES, type OrderStatus } from '../models/Order.js';
import {
  createOrderSchema,
  updateStatusSchema,
  listOrdersSchema,
  statsRangeSchema,
  type CreateOrderInput,
  type UpdateStatusInput,
  type ListOrdersInput,
  type StatsRangeInput,
} from '../schemas/order.js';
import { validate, getValidated } from '../middleware/validate.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { emitNewOrder, emitStatusChanged, emitOrderDeleted } from '../sockets/index.js';
import { sendPushToAllAdmins } from '../lib/webpush.js';
import { upsertCustomerFromOrder, applyOrderCancellation } from '../lib/customers.js';
import { logger } from '../lib/logger.js';

export const ordersRouter = Router();

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { error: 'Muitos pedidos seguidos. Aguarde um instante.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

ordersRouter.post('/', createLimiter, validate(createOrderSchema), async (req, res) => {
  const data = getValidated<CreateOrderInput>(req);

  const items = data.items.map((i) => ({
    ...i,
    subtotal: Number((i.price * i.quantity).toFixed(2)),
  }));
  const subtotal = Number(items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
  const total = Number((subtotal + (data.deliveryFee ?? 0)).toFixed(2));

  const sourceIp =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '';

  const order = await Order.create({
    customer: data.customer,
    items,
    deliveryDate: new Date(data.deliveryDate),
    payment: data.payment,
    subtotal,
    deliveryFee: data.deliveryFee ?? 0,
    deliveryFeeNote: data.deliveryFeeNote ?? '',
    total,
    notes: data.notes ?? '',
    sourceIp,
  });

  logger.info(
    { orderId: order._id, customer: order.customer?.fullName, total: order.total },
    '📦 Novo pedido recebido'
  );

  // Upsert do cliente — não bloqueia a resposta
  void upsertCustomerFromOrder(data.customer, total).catch((err) =>
    logger.error({ err }, 'upsertCustomerFromOrder falhou')
  );

  emitNewOrder(order.toJSON());

  // Fire-and-forget: não bloqueia a resposta ao cliente
  void sendPushToAllAdmins({
    title: '🛒 Novo pedido — 100 Cinco',
    body: `${order.customer?.fullName ?? 'Cliente'} • R$ ${order.total.toFixed(2).replace('.', ',')}`,
    url: '/pedidos.html',
    tag: `order-${order._id}`,
    requireInteraction: true,
    data: { orderId: String(order._id) },
  }).catch((err) => logger.error({ err }, 'sendPushToAllAdmins falhou'));

  res.status(201).json({
    id: order._id,
    status: order.status,
    createdAt: order.createdAt,
  });
});

ordersRouter.get('/', authRequired, validate(listOrdersSchema, 'query'), async (req, res) => {
  const { status, search, limit, since, from, to } = getValidated<ListOrdersInput>(req);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const dateFilter: Record<string, Date> = {};
  if (since) dateFilter.$gte = new Date(since);
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  if (Object.keys(dateFilter).length > 0) filter.createdAt = dateFilter;

  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ 'customer.fullName': rx }, { 'customer.phone': rx }];
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ orders });
});

ordersRouter.get('/stats/today', authRequired, async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orders = await Order.find({ createdAt: { $gte: startOfDay } }).lean();
  const byStatus: Record<OrderStatus, number> = {
    novo: 0,
    em_preparo: 0,
    saiu_para_entrega: 0,
    entregue: 0,
    cancelado: 0,
  };
  let revenue = 0;
  for (const o of orders) {
    byStatus[o.status as OrderStatus]++;
    if (o.status !== 'cancelado') revenue += o.total;
  }
  res.json({
    total: orders.length,
    byStatus,
    revenue: Number(revenue.toFixed(2)),
  });
});

/**
 * Stats agregadas por período: total, faturamento, ticket médio,
 * breakdown por status, série temporal por dia, top produtos e top cidades.
 * Se from/to não vier, default = últimos 7 dias.
 */
ordersRouter.get(
  '/stats/range',
  authRequired,
  validate(statsRangeSchema, 'query'),
  async (req, res) => {
    const { from, to } = getValidated<StatsRangeInput>(req);

    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } }).lean();

    const byStatus: Record<OrderStatus, number> = {
      novo: 0,
      em_preparo: 0,
      saiu_para_entrega: 0,
      entregue: 0,
      cancelado: 0,
    };

    let totalRevenue = 0;
    let validForRevenue = 0;
    const dayMap = new Map<string, { count: number; revenue: number }>();
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const cityMap = new Map<string, number>();
    const paymentMap: Record<string, number> = { Pix: 0, Dinheiro: 0 };

    // Preenche dias vazios pra série temporal
    const dayCursor = new Date(start);
    while (dayCursor <= end) {
      const key = dayCursor.toISOString().slice(0, 10);
      dayMap.set(key, { count: 0, revenue: 0 });
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    for (const o of orders) {
      byStatus[o.status as OrderStatus]++;

      const dayKey = new Date(o.createdAt as Date).toISOString().slice(0, 10);
      const day = dayMap.get(dayKey) ?? { count: 0, revenue: 0 };
      day.count++;
      if (o.status !== 'cancelado') {
        day.revenue += o.total;
        totalRevenue += o.total;
        validForRevenue++;
      }
      dayMap.set(dayKey, day);

      if (o.customer?.city) {
        cityMap.set(o.customer.city, (cityMap.get(o.customer.city) ?? 0) + 1);
      }
      if (o.payment && o.status !== 'cancelado') {
        paymentMap[o.payment] = (paymentMap[o.payment] ?? 0) + 1;
      }

      for (const item of o.items ?? []) {
        const key = item.name;
        const cur = productMap.get(key) ?? { name: item.name, quantity: 0, revenue: 0 };
        cur.quantity += item.quantity;
        cur.revenue += item.subtotal ?? item.price * item.quantity;
        productMap.set(key, cur);
      }
    }

    const series = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, count: v.count, revenue: Number(v.revenue.toFixed(2)) }));

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((p) => ({ ...p, revenue: Number(p.revenue.toFixed(2)) }));

    const topCities = Array.from(cityMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    res.json({
      range: { from: start.toISOString(), to: end.toISOString() },
      total: orders.length,
      revenue: Number(totalRevenue.toFixed(2)),
      avgTicket: validForRevenue > 0 ? Number((totalRevenue / validForRevenue).toFixed(2)) : 0,
      byStatus,
      byPayment: paymentMap,
      series,
      topProducts,
      topCities,
    });
  }
);

ordersRouter.get('/:id', authRequired, async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json({ order });
});

ordersRouter.patch(
  '/:id/status',
  authRequired,
  validate(updateStatusSchema),
  async (req: AuthRequest, res) => {
    const { status } = getValidated<UpdateStatusInput>(req);

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    if (order.status === status) {
      return res.json({ order: order.toJSON() });
    }

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user?.username ?? 'desconhecido',
    });
    await order.save();

    // Cliente: se acabou de cancelar, ajusta totais
    if (status === 'cancelado' && previousStatus !== 'cancelado' && order.customer) {
      void applyOrderCancellation(order.customer.phone, order.total).catch((err) =>
        logger.error({ err }, 'applyOrderCancellation falhou')
      );
    }

    logger.info({ orderId: order._id, status, by: req.user?.username }, '🔄 Status alterado');
    emitStatusChanged(order.toJSON());

    res.json({ order: order.toJSON() });
  }
);

ordersRouter.delete('/:id', authRequired, async (req: AuthRequest, res) => {
  const order = await Order.findByIdAndDelete(req.params.id).lean();
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  logger.warn({ orderId: req.params.id, by: req.user?.username }, '🗑️  Pedido removido');
  emitOrderDeleted(req.params.id);

  res.json({ ok: true });
});

ordersRouter.get('/_meta/statuses', (_req, res) => {
  res.json({ statuses: ORDER_STATUSES });
});
