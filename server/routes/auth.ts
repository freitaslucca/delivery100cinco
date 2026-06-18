import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { Admin } from '../models/Admin.js';
import { loginSchema, type LoginInput } from '../schemas/auth.js';
import { validate, getValidated } from '../middleware/validate.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';
import { signJwt } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

authRouter.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { username, password } = getValidated<LoginInput>(req);

  const admin = await Admin.findOne({ username }).lean();
  if (!admin) {
    await bcrypt.compare(password, '$2a$10$invalidsaltinvalidsaltinvali.dummyDummyDummyDummyDummyDu');
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  await Admin.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });

  const token = signJwt({
    sub: String(admin._id),
    username: admin.username,
    role: admin.role ?? 'admin',
  });

  logger.info({ username }, '🔐 Login bem-sucedido');

  res.json({
    token,
    user: {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    },
  });
});

authRouter.get('/me', authRequired, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});
