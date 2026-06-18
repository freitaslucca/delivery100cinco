import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const AddressSchema = new Schema(
  {
    cep: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, required: true },
    number: { type: String, trim: true, required: true },
    complement: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, required: true },
    timesUsed: { type: Number, default: 1, min: 1 },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    phoneDigits: { type: String, required: true, index: true }, // só dígitos pra busca
    fullName: { type: String, required: true, trim: true },
    addresses: { type: [AddressSchema], default: [] },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    firstOrderAt: { type: Date },
    lastOrderAt: { type: Date },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

CustomerSchema.index({ fullName: 'text' });
CustomerSchema.index({ lastOrderAt: -1 });

export type CustomerDoc = HydratedDocument<InferSchemaType<typeof CustomerSchema>>;
export const Customer = model('Customer', CustomerSchema);
