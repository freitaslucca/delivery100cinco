import { z } from 'zod';
import { ORDER_STATUSES } from '../models/Order.js';

const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

export const createOrderSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2, 'Nome muito curto').max(120),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Telefone inválido. Use (XX) XXXXX-XXXX'),
    cep: z.string().trim().max(10).optional().default(''),
    address: z.string().trim().min(2).max(200),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2).max(80),
  }),
  items: z
    .array(
      z.object({
        productId: z.number().int().optional(),
        name: z.string().trim().min(1).max(160),
        image: z.string().max(500).optional(),
        quantity: z.number().int().positive().max(999),
        price: z.number().nonnegative().max(99999),
      })
    )
    .min(1, 'Pedido precisa ter pelo menos 1 item')
    .max(100, 'Limite de itens excedido'),
  deliveryDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Data de entrega inválida'),
  payment: z.enum(['Pix', 'Dinheiro']),
  deliveryFee: z.number().nonnegative().optional().default(0),
  deliveryFeeNote: z.string().max(200).optional().default(''),
  notes: z.string().max(500).optional().default(''),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const listOrdersSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().positive().max(500).default(200),
  since: z
    .string()
    .optional()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), 'Data inválida'),
  from: z
    .string()
    .optional()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), 'Data "from" inválida'),
  to: z
    .string()
    .optional()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), 'Data "to" inválida'),
});

export type ListOrdersInput = z.infer<typeof listOrdersSchema>;

export const statsRangeSchema = z.object({
  from: z
    .string()
    .optional()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), 'Data "from" inválida'),
  to: z
    .string()
    .optional()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), 'Data "to" inválida'),
});
export type StatsRangeInput = z.infer<typeof statsRangeSchema>;
