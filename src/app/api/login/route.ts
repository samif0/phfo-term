import { NextResponse } from 'next/server';
import { createAdminToken, verifyAdminPassword } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const rate = enforceRateLimit(req, 'login', 12, 60_000);
  if (!rate.allowed) {
    console.warn('[auth] login rate limited');
    return NextResponse.json(
      { success: false, error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = (await req.json()) as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!password) {
      return NextResponse.json({ success: false, error: 'password is required' }, { status: 400 });
    }

    const passwordValid = await verifyAdminPassword(password);
    if (!passwordValid) {
      console.warn('[auth] login password mismatch');
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    const token = await createAdminToken();
    res.cookies.set('adminAuth', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error) {
    console.error('[auth] login failed', { error });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
