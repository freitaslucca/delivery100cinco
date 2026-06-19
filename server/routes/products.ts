import { Router } from 'express';
import { Product } from '../models/Product.js';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  setStockSchema,
  listProductsAdminSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type AdjustStockInput,
  type SetStockInput,
  type ListProductsAdminInput,
} from '../schemas/product.js';
import { validate, getValidated } from '../middleware/validate.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

export const productsRouter = Router();

/**
 * Catálogo público — só produtos ativos. O stock vai pro cliente
 * pra UI conseguir mostrar "Esgotado" e "Últimas unidades".
 */
productsRouter.get('/', async (_req, res) => {
  const products = await Product.find({ active: true })
    .sort({ sortOrder: 1, productId: 1 })
    .lean();
  res.json({ products });
});

/**
 * Admin — lista tudo com filtros.
 */
productsRouter.get(
  '/admin',
  authRequired,
  validate(listProductsAdminSchema, 'query'),
  async (req, res) => {
    const { search, filter, limit } = getValidated<ListProductsAdminInput>(req);

    const conditions: Record<string, unknown>[] = [];
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      conditions.push({ name: rx });
    }
    if (filter === 'active') conditions.push({ active: true });
    else if (filter === 'inactive') conditions.push({ active: false });
    else if (filter === 'out_of_stock') conditions.push({ stock: 0 });
    else if (filter === 'low_stock') {
      conditions.push({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } });
      conditions.push({ stock: { $gt: 0 } });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const products = await Product.find(query)
      .sort({ sortOrder: 1, productId: 1 })
      .limit(limit)
      .lean();

    const stats = await Product.aggregate<{ _id: string; n: number }>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$active', 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$stock', 0] },
                    { $lte: ['$stock', '$lowStockThreshold'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    res.json({ products, stats: stats[0] ?? { total: 0, active: 0, outOfStock: 0, lowStock: 0 } });
  }
);

productsRouter.post(
  '/',
  authRequired,
  validate(createProductSchema),
  async (req: AuthRequest, res) => {
    const data = getValidated<CreateProductInput>(req);

    let productId = data.productId;
    if (productId === undefined) {
      const last = await Product.findOne({}).sort({ productId: -1 }).select('productId').lean();
      productId = (last?.productId ?? 0) + 1;
    } else {
      const dupe = await Product.findOne({ productId }).lean();
      if (dupe) {
        return res.status(409).json({ error: `productId ${productId} já existe` });
      }
    }

    const product = await Product.create({ ...data, productId });
    logger.info({ productId, name: product.name, by: req.user?.username }, '➕ Produto criado');
    res.status(201).json({ product: product.toJSON() });
  }
);

productsRouter.patch(
  '/:productId',
  authRequired,
  validate(updateProductSchema),
  async (req: AuthRequest, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId)) return res.status(400).json({ error: 'productId inválido' });

    const data = getValidated<UpdateProductInput>(req);
    // Não deixa trocar o productId via PATCH — é a chave.
    delete (data as { productId?: number }).productId;

    const product = await Product.findOneAndUpdate({ productId }, data, { new: true }).lean();
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    logger.info(
      { productId, by: req.user?.username, fields: Object.keys(data) },
      '✏️  Produto atualizado'
    );
    res.json({ product });
  }
);

productsRouter.post(
  '/:productId/stock/adjust',
  authRequired,
  validate(adjustStockSchema),
  async (req: AuthRequest, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId)) return res.status(400).json({ error: 'productId inválido' });
    const { delta, reason } = getValidated<AdjustStockInput>(req);

    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    const next = product.stock + delta;
    if (next < 0) {
      return res.status(400).json({
        error: `Estoque não pode ficar negativo (atual: ${product.stock}, ajuste: ${delta})`,
      });
    }
    product.stock = next;
    await product.save();

    logger.info(
      { productId, delta, newStock: next, reason, by: req.user?.username },
      '📦 Estoque ajustado'
    );
    res.json({ product: product.toJSON() });
  }
);

productsRouter.post(
  '/:productId/stock/set',
  authRequired,
  validate(setStockSchema),
  async (req: AuthRequest, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId)) return res.status(400).json({ error: 'productId inválido' });
    const { stock } = getValidated<SetStockInput>(req);

    const product = await Product.findOneAndUpdate(
      { productId },
      { stock },
      { new: true }
    ).lean();
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    logger.info({ productId, newStock: stock, by: req.user?.username }, '📦 Estoque definido');
    res.json({ product });
  }
);

productsRouter.delete('/:productId', authRequired, async (req: AuthRequest, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: 'productId inválido' });

  const product = await Product.findOneAndDelete({ productId }).lean();
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  logger.warn({ productId, by: req.user?.username }, '🗑️  Produto removido');
  res.json({ ok: true });
});
