import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const AdminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'operator'], default: 'admin' },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type AdminDoc = HydratedDocument<InferSchemaType<typeof AdminSchema>>;
export const Admin = model('Admin', AdminSchema);
