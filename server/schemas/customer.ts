import { z } from 'zod';

export const listCustomersSchema = z.object({
  search: z.string().trim().max(80).optional(),
  sortBy: z.enum(['lastOrderAt', 'totalSpent', 'totalOrders', 'fullName']).default('lastOrderAt'),
  limit: z.coerce.number().int().positive().max(500).default(100),
});
export type ListCustomersInput = z.infer<typeof listCustomersSchema>;

export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
});
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
