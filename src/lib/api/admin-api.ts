import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'rate_limited' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

export async function ensureAdmin(req: Request, scope: string, maxRequests = 60, windowMs = 60_000) {
  const rate = enforceRateLimit(req, scope, maxRequests, windowMs);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return null;
}
