// src/middleware.ts
import {NextResponse, type NextRequest} from 'next/server';

// --- Configuration ---
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONT_ORIGIN_PROD!]
    : ['http://localhost:3000', 'http://localhost:9002'];

// --- Main Middleware Logic ---
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Only apply middleware to /api/ routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (isAllowedOrigin) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    return new NextResponse(null, { status: 204, headers });
  }

  // Add CORS headers to the actual response
  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  return response;
}

// --- Config ---
export const config = {
  matcher: '/api/:path*',
};
