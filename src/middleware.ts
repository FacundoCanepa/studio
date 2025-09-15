// src/middleware.ts
import {NextResponse, type NextRequest} from 'next/server';
import {RateLimiter} from '@/lib/api/rate-limiter';
import {validateCsrf} from '@/lib/api/csrf';
import {respondWithError} from '@/lib/api-utils';

// --- Configuration ---

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONT_ORIGIN_PROD!]
    : [process.env.FRONT_ORIGIN_DEV!, 'http://localhost:9002'];

const sensitiveRoutes = [
  '/api/session/login',
  '/api/session/register',
  '/api/password/forgot',
  '/api/password/reset',
  '/api/session/set',
];

const csrfProtectedRoutes = [
  '/api/session/login',
  '/api/session/register',
  '/api/session/logout',
  '/api/password/forgot',
  '/api/password/reset',
  '/api/session/set',
];

// --- Main Middleware Logic ---

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const method = request.method;

  // Only apply middleware to /api/ routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // --- CORS Preflight and Header Handling ---
  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  if (method === 'OPTIONS') {
    if (isAllowedOrigin) {
      return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }
    return respondWithError('cors_denied');
  }

  // --- Security Checks for Non-Preflight Requests ---
  if (!isAllowedOrigin && origin) {
    // Block requests from non-allowed origins
    return respondWithError('cors_denied');
  }
  
  // Rate Limiting
  if (sensitiveRoutes.includes(pathname)) {
    const ip = request.ip ?? '127.0.0.1';
    const identifier = `${ip}:${pathname}`;
    const {success} = await RateLimiter.limit(identifier);
    if (!success) {
      return respondWithError('rate_limited');
    }
  }

  // CSRF Protection for mutating endpoints
  if (method === 'POST' && csrfProtectedRoutes.includes(pathname)) {
    const csrfErrorResponse = await validateCsrf(request);
    if (csrfErrorResponse) {
      return csrfErrorResponse;
    }
  }

  // If all checks pass, proceed and add CORS headers to the final response
  const response = NextResponse.next();
  Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// --- Helper Functions ---

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// --- Config ---

export const config = {
  matcher: '/api/:path*',
};
