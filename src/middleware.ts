import {NextResponse, type NextRequest} from 'next/server';
import {rateLimiter} from '@/lib/api/rate-limiter';
import {validateCsrf} from '@/lib/api/csrf';

// Define allowed origins for CORS
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONT_ORIGIN_PROD!]
    : [process.env.FRONT_ORIGIN_DEV!, 'http://localhost:9002'];

// Middleware function to handle API security
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Only apply middleware to /api/ routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCors(request, new NextResponse(null, {status: 204}));
  }

  const response = NextResponse.next();
  handleCors(request, response); // Apply CORS headers to the actual request

  // --- Security Checks ---
  try {
    // 1. Rate Limiting for sensitive endpoints
    const sensitiveRoutes = [
      '/api/session/login',
      '/api/session/register',
      '/api/password/forgot',
      '/api/password/reset',
      '/api/session/set',
    ];
    if (sensitiveRoutes.includes(pathname)) {
      const ip = request.ip ?? '127.0.0.1';
      const {success} = await rateLimiter.limit(ip);
      if (!success) {
        return new NextResponse('Too many requests.', {status: 429});
      }
    }

    // 2. CSRF Protection for all mutating API routes (POST, PUT, DELETE)
    const isMutation =
      request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'DELETE';
    if (isMutation) {
      await validateCsrf(request);
    }
  } catch (error: any) {
    // Return a generic error to avoid leaking implementation details
    return new NextResponse(error.message || 'Forbidden', {
      status: error.status || 403,
    });
  }

  return response;
}

// Helper function to manage CORS headers
function handleCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin') ?? '';
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CSRF-Token'
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// Config to specify which paths the middleware should run on
export const config = {
  matcher: '/api/:path*',
};
