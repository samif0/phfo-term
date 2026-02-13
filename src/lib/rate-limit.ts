interface RateLimitState {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const buckets = new Map<string, RateLimitState>();

function cleanupBuckets(now: number) {
  if (buckets.size < 5000) {
    return;
  }

  for (const [key, value] of buckets) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',');
    const ip = first?.trim();
    if (ip) {
      return ip;
    }
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export function enforceRateLimit(
  req: Request,
  keyPrefix: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanupBuckets(now);

  const key = `${keyPrefix}:${getClientIp(req)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  if (existing.count > maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}
