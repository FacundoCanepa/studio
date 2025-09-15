// src/middleware.ts
import {NextResponse, type NextRequest} from 'next/server';
import {validateCsrf} from '@/lib/api/csrf';
import {respondWithError} from '@/lib/api-utils';

// --- Configuration ---
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONT_ORIGIN_PROD!].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:9002'];

if (process.env.NODE_ENV === 'production' && !allowedOrigins.length) {
  console.warn(
    'WARNING: No production origin specified in FRONT_ORIGIN_PROD. CORS may block requests.'
  );
}

const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// --- Main Middleware Logic ---
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Only apply middleware to /api/ routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // --- CORS Handling ---
  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    if (isAllowedOrigin) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-csrf-token'
    );
    headers.set('Access-Control-Allow-Credentials', 'true');
    return new NextResponse(null, {status: 204, headers});
  }

  const response = NextResponse.next();

  // Add CORS headers to the actual response
  if (isAllowedOrigin) {
    response.headers.set('Access-control-allow-origin', origin);
    response.headers.set('Access-control-allow-credentials', 'true');
  } else {
    // Block requests from non-allowed origins, except for health checks or safe methods
    if (pathname !== '/api/_health/auth' && request.method !== 'GET') {
      return respondWithError('cors_denied');
    }
  }

  // --- CSRF Protection ---
  // Apply CSRF validation only to mutating API endpoints.
  if (
    MUTATING_METHODS.includes(request.method) &&
    !pathname.startsWith('/api/_health/') && // Exclude health checks
    !pathname.startsWith('/api/csrf') // Exclude the CSRF token endpoint itself
  ) {
    const csrfErrorResponse = await validateCsrf(request);
    if (csrfErrorResponse) {
      return csrfErrorResponse;
    }
  }

  return response;
}

// --- Config ---
export const config = {
  matcher: '/api/:path*',
};
