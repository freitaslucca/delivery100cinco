import { Router } from 'express';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import {
  listCustomersSchema,
  updateCustomerSchema,
  type ListCustomersInput,
  type UpdateCustomerInput,
} from '../schemas/customer.js';
import { validate, getValidated } from '../middleware/validate.js';
import { authRequired } from '../middleware/auth.js';

export const customersRouter = Router();

customersRouter.get(
  '/',
  authRequired,
  validate(listCustomersSchema, 'query'),
  async (req, res) => {
    const { search, sortBy, limit } = getValidated<ListCustomersInput>(req);

    const filter: Record<string, unknown> = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const digits = search.replace(/\D/g, '');
      const $or: Record<string, unknown>[] = [{ fullName: rx }];
      if (digits) $or.push({ phoneDigits: new RegExp(digits) });
      filter.$or = $or;
    }

    const sort: Record<string, 1 | -1> = sortBy === 'fullName' ? { fullName: 1 } : { [sortBy]: -1 };

    const [items, total] = await Promise.all([
      Customer.find(filter).sort(sort).limit(limit).lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({ customers: items, total });
  }
);

customersRouter.get('/stats', authRequired, async (_req, res) => {
  const [total, withRepeat] = await Promise.all([
    Customer.countDocuments({}),
    Customer.countDocuments({ totalOrders: { $gte: 2 } }),
  ]);
  const totalSpentAgg = await Customer.aggregate<{ total: number }>([
    { $group: { _id: null, total: { $sum: '$totalSpent' } } },
  ]);
  res.json({
    total,
    repeatCustomers: withRepeat,
    totalSpent: Number((totalSpentAgg[0]?.total ?? 0).toFixed(2)),
  });
});

customersRouter.get('/:id', authRequired, async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });

  const orders = await Order.find({ 'customer.phone': customer.phone })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ customer, orders });
});

customersRouter.patch(
  '/:id',
  authRequired,
  validate(updateCustomerSchema),
  async (req, res) => {
    const data = getValidated<UpdateCustomerInput>(req);
    const customer = await Customer.findByIdAndUpdate(req.params.id, data, { new: true }).lean();
    if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json({ customer });
  }
);

customersRouter.delete('/:id', authRequired, async (req, res) => {
  const c = await Customer.findByIdAndDelete(req.params.id).lean();
  if (!c) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json({ ok: true });
});
