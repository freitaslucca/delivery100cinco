import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtPayload {
  sub: string;
  username: string;
  role: 'admin' | 'operator';
}

export function signJwt(payload: JwtPayload): string {
  const opts: SignOptions = { expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, config.JWT_SECRET, opts);
}

export function verifyJwt(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Token inválido');
  }
  return decoded as JwtPayload;
}
