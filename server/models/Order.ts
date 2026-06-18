import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const ORDER_STATUSES = [
  'novo',
  'em_preparo',
  'saiu_para_entrega',
  'entregue',
  'cancelado',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const OrderItemSchema = new Schema(
  {
    productId: { type: Number },
    name: { type: String, required: true, trim: true },
    image: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    customer: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      cep: { type: String, trim: true },
      address: { type: String, required: true, trim: true },
      number: { type: String, required: true, trim: true },
      complement: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (arr: unknown[]) => Array.isArray(arr) && arr.length > 0,
        message: 'Pedido precisa ter pelo menos 1 item',
      },
    },
    deliveryDate: { type: Date, required: true },
    payment: { type: String, enum: ['Pix', 'Dinheiro'], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    deliveryFeeNote: { type: String, default: '' },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'novo',
      required: true,
      index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    notes: { type: String, default: '' },
    sourceIp: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'customer.phone': 1 });

OrderSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'system',
    });
  }
  next();
});

export type OrderDoc = HydratedDocument<InferSchemaType<typeof OrderSchema>>;
export const Order = model('Order', OrderSchema);
