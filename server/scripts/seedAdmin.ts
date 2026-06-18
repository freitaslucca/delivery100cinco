import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { Admin } from '../models/Admin.js';
import { logger } from '../lib/logger.js';

async function run(): Promise<void> {
  const username = (config.ADMIN_USERNAME ?? '').trim().toLowerCase();
  const password = config.ADMIN_PASSWORD ?? '';

  if (!username || !password) {
    console.error('❌ Defina ADMIN_USERNAME e ADMIN_PASSWORD no .env antes de rodar o seed.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ A senha de admin precisa ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  await mongoose.connect(config.MONGODB_URI);

  const existing = await Admin.findOne({ username });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    logger.info({ username }, '🔁 Senha do admin atualizada');
    console.log(`\n✅ Admin "${username}" teve a senha atualizada com sucesso.\n`);
  } else {
    await Admin.create({ username, passwordHash, role: 'admin' });
    logger.info({ username }, '✨ Admin criado');
    console.log(`\n✅ Admin "${username}" criado com sucesso.\n`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Falha no seed:', err);
  process.exit(1);
});
