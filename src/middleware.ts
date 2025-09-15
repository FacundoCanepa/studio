
// src/middleware.ts
import {NextResponse, type NextRequest} from 'next/server';
import {validateCsrf} from '@/lib/api/csrf';
import {respondWithError} from '@/lib/api-utils';

// --- Configuration ---

function getAllowedOrigins(): string[] {
    const allowed = new Set<string>();

    // For local development
    if (process.env.NODE_ENV !== 'production') {
        allowed.add('http://localhost:3000');
        allowed.add('http://localhost:9002');
    }

    // For Firebase Studio environment
    allowed.add('https://studio-lemon.vercel.app');

    // For Vercel deployments (production and previews)
    if (process.env.VERCEL_URL) {
        allowed.add(`https://${process.env.VERCEL_URL}`);
    }
    // Specific Vercel preview URL, if available
    if (process.env.VERCEL_BRANCH_URL) {
        allowed.add(`https://${process.env.VERCEL_BRANCH_URL}`);
    }

    // Main production URL from env var
    if (process.env.FRONT_ORIGIN_PROD) {
        allowed.add(process.env.FRONT_ORIGIN_PROD);
    }
    
    const allowedArray = Array.from(allowed);
    console.log('[MIDDLEWARE_CONFIG] Allowed Origins:', allowedArray);
    
    return allowedArray;
}


const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// --- Main Middleware Logic ---
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  
  // Dynamically determine allowed origins
  const allowedOrigins = getAllowedOrigins();

  // Only apply middleware to /api/ routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  const origin = request.headers.get('origin') ?? '';
  console.log(`[MIDDLEWARE] Request received for: ${request.method} ${pathname} from origin: ${origin}`);


  // --- CORS Handling ---
  const isAllowedOrigin = allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin));

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('[MIDDLEWARE] Handling OPTIONS preflight request.');
    if (isAllowedOrigin) {
      console.log(`[MIDDLEWARE] Origin ${origin} is allowed.`);
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');
      headers.set('Access-Control-Allow-Credentials', 'true');
      return new NextResponse(null, {status: 204, headers});
    } else {
       console.warn(`[MIDDLEWARE] OPTIONS request from disallowed origin ${origin}.`);
       return new NextResponse(null, { status: 204 }); // Still respond to OPTIONS, but without allow headers.
    }
  }

  // Block non-preflight, non-allowed origins immediately
  if (!isAllowedOrigin && pathname !== '/api/_health/auth') {
    console.error(`[MIDDLEWARE] CORS denied for origin: ${origin} on path: ${pathname}`);
    return respondWithError('cors_denied');
  }
  
  const response = NextResponse.next();
  
  // Add CORS headers to the actual response for allowed origins
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
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
