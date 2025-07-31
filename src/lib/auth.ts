import { cookies } from 'next/headers';
import crypto from 'crypto';

function getSecret() {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_TOKEN_SECRET not set');
  }
  return secret;
}

function sign(payload: string) {
  const h = crypto.createHmac('sha256', getSecret());
  h.update(payload);
  const signature = h.digest('hex');
  return `${payload}.${signature}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf('.');
  if (idx === -1) return null;
  const payload = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const h = crypto.createHmac('sha256', getSecret());
  h.update(payload);
  const expected = h.digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  const valid = crypto.timingSafeEqual(sigBuf, expBuf);
  return valid ? payload : null;
}

export function createAdminToken() {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h
  return sign(`admin:${exp}`);
}

export async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('adminAuth')?.value;
  if (!token) return false;
  const payload = verify(token);
  if (!payload) return false;
  const [role, exp] = payload.split(':');
  if (role !== 'admin') return false;
  const expiry = parseInt(exp, 10);
  if (!expiry || Date.now() / 1000 > expiry) return false;
  return true;
}
