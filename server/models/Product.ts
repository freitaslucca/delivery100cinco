import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const ProductSchema = new Schema(
  {
    productId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true, default: '' },
    quantityType: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    category: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

ProductSchema.index({ active: 1, sortOrder: 1, productId: 1 });
ProductSchema.index({ name: 'text' });

export type ProductDoc = HydratedDocument<InferSchemaType<typeof ProductSchema>>;
export const Product = model('Product', ProductSchema);
