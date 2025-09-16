
// src/middleware.ts
import {NextResponse, type NextRequest} from 'next/server';
import {validateCsrf} from '@/lib/api/csrf';

// --- Configuration ---
const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// --- Main Middleware Logic ---
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const origin = request.headers.get('origin') ?? '';

  // Only apply middleware to /api/ routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
      const headers = new Headers();
      // Allow any origin for OPTIONS preflight, the browser will enforce the actual policy.
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');
      headers.set('Access-Control-Allow-Credentials', 'true');
      return new NextResponse(null, {status: 204, headers});
  }

  // --- CSRF Protection ---
  // Apply CSRF validation only to mutating API endpoints that are not part of the health check or csrf token generation.
  const isCsrfProtected = MUTATING_METHODS.includes(request.method) &&
    !pathname.startsWith('/api/_health/') &&
    !pathname.startsWith('/api/csrf');

  if (isCsrfProtected) {
    const csrfErrorResponse = await validateCsrf(request);
    if (csrfErrorResponse) {
      return csrfErrorResponse;
    }
  }

  // Add necessary CORS headers to actual responses.
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// --- Config ---
export const config = {
  matcher: '/api/:path*',
};
