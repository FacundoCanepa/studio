
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
  
  const origin = request.headers.get('origin') ?? '';
  console.log(`[MIDDLEWARE] Request received for: ${request.method} ${pathname} from origin: ${origin}`);


  // --- CORS Handling ---
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('[MIDDLEWARE] Handling OPTIONS preflight request.');
    const headers = new Headers();
    if (isAllowedOrigin) {
      console.log(`[MIDDLEWARE] Origin ${origin} is allowed.`);
      headers.set('Access-Control-Allow-Origin', origin);
    } else {
       console.warn(`[MIDDLEWARE] Origin ${origin} is NOT allowed.`);
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
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
      console.error(`[MIDDLEWARE] CORS denied for origin: ${origin} on path: ${pathname}`);
      return respondWithError('cors_denied');
    }
  }

  // --- CSRF Protection ---
  // Apply CSRF validation only to mutating API endpoints.
  const isCsrfProtected = MUTATING_METHODS.includes(request.method) &&
    !pathname.startsWith('/api/_health/') &&
    !pathname.startsWith('/api/csrf');

  if (isCsrfProtected) {
    console.log(`[MIDDLEWARE] Applying CSRF protection for ${request.method} ${pathname}`);
    const csrfErrorResponse = await validateCsrf(request);
    if (csrfErrorResponse) {
      console.error(`[MIDDLEWARE] CSRF validation failed for ${pathname}`);
      return csrfErrorResponse;
    }
    console.log(`[MIDDLEWARE] CSRF validation successful for ${pathname}`);
  }

  return response;
}

// --- Config ---
export const config = {
  matcher: '/api/:path*',
};
