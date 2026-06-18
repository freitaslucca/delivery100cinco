import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const PushSubscriptionSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: '' },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

PushSubscriptionSchema.index({ adminId: 1, endpoint: 1 });

export type PushSubscriptionDoc = HydratedDocument<
  InferSchemaType<typeof PushSubscriptionSchema>
>;
export const PushSubscription = model('PushSubscription', PushSubscriptionSchema);
