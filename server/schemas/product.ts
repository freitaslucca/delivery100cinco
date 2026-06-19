import { z } from 'zod';

export const createProductSchema = z.object({
  productId: z.number().int().positive().optional(),
  name: z.string().trim().min(1, 'Nome obrigatório').max(160),
  image: z.string().trim().max(500).optional().default(''),
  quantityType: z.string().trim().max(80).optional().default(''),
  description: z.string().max(5000).optional().default(''),
  category: z.string().trim().max(60).optional().default(''),
  price: z.number().nonnegative().max(99999),
  stock: z.number().int().nonnegative().max(999999).optional().default(0),
  lowStockThreshold: z.number().int().nonnegative().max(99999).optional().default(5),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const adjustStockSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, 'delta não pode ser 0'),
  reason: z.string().trim().max(200).optional().default(''),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const setStockSchema = z.object({
  stock: z.number().int().nonnegative().max(999999),
});
export type SetStockInput = z.infer<typeof setStockSchema>;

export const listProductsAdminSchema = z.object({
  search: z.string().trim().max(80).optional(),
  filter: z.enum(['all', 'active', 'inactive', 'low_stock', 'out_of_stock']).optional().default('all'),
  limit: z.coerce.number().int().positive().max(500).default(500),
});
export type ListProductsAdminInput = z.infer<typeof listProductsAdminSchema>;
