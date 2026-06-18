import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(60),
  password: z.string().min(6).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
