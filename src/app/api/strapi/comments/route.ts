import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';

import { proxyStrapiRequest } from '../strapi-proxy';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const hashValue = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const resolveClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [first] = forwardedFor.split(',');
    if (first && first.trim().length > 0) {
      return first.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return 'unknown';
};

const getRateLimitKey = (request: Request): string => {
  const explicitUser = request.headers.get('x-user-id');
  if (explicitUser && explicitUser.trim().length > 0) {
    return `user:${explicitUser.trim()}`;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.trim().length > 0) {
    return `auth:${hashValue(authHeader.trim())}`;
  }

  return `ip:${resolveClientIp(request)}`;
};

const registerRateLimitAttempt = (request: Request) => {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      key,
      retryAfterMs: Math.max(existing.expiresAt - now, 0),
    };
  }

  existing.count += 1;
  return null;
};

export const resetCommentRateLimiterForTests = () => {
  rateLimitStore.clear();
};

export async function GET(request: Request) {
  return proxyStrapiRequest(request, 'comments', { context: 'STRAPI_COMMENTS' });
}

export async function POST(request: Request) {
  const violation = registerRateLimitAttempt(request);
  if (violation) {
    const retrySeconds = Math.max(1, Math.ceil(violation.retryAfterMs / 1000));
    console.warn('[STRAPI_COMMENTS_RATE_LIMIT]', {
      key: violation.key,
      retrySeconds,
    });

    return NextResponse.json(
      {
        error: 'Has superado el límite de comentarios. Inténtalo nuevamente en un minuto.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': `${retrySeconds}`,
        },
      }
    );
  }

  return proxyStrapiRequest(request, 'comments', { context: 'STRAPI_COMMENTS' });
}