import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getAdminPasswordHash, getAdminTokenSecret } from './secrets';

async function sign(payload: string) {
  const secret = await getAdminTokenSecret();
  const h = crypto.createHmac('sha256', secret);
  h.update(payload);
  const signature = h.digest('hex');
  return `${payload}.${signature}`;
}

async function verify(token: string): Promise<string | null> {
  const idx = token.lastIndexOf('.');
  if (idx === -1) return null;

  const payload = token.slice(0, idx);
  const signature = token.slice(idx + 1);

  const secret = await getAdminTokenSecret();
  const h = crypto.createHmac('sha256', secret);
  h.update(payload);
  const expected = h.digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return null;

  const valid = crypto.timingSafeEqual(sigBuf, expBuf);
  return valid ? payload : null;
}

export async function verifyAdminPassword(candidatePassword: string): Promise<boolean> {
  const hash = await getAdminPasswordHash();
  return bcrypt.compare(candidatePassword, hash);
}

export async function createAdminToken() {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  return sign(`admin:${exp}`);
}

export async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('adminAuth')?.value;
  if (!token) return false;

  const payload = await verify(token);
  if (!payload) return false;

  const [role, exp] = payload.split(':');
  if (role !== 'admin') return false;

  const expiry = parseInt(exp, 10);
  if (!expiry || Date.now() / 1000 > expiry) return false;

  return true;
}
