// src/app/api/_health/auth/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {respondWithError} from '@/lib/api-utils';

/**
 * Health check endpoint for authentication and security setup.
 *
 * This endpoint can be used to verify:
 * 1. CORS policy is correctly configured.
 * 2. CSRF protection is active (by checking for the csrf cookie, though this endpoint doesn't validate it).
 * 3. The API route handler is correctly processing requests.
 */
export async function GET(request: NextRequest) {
  try {
    // The middleware handles CORS, so if we reach here, CORS is likely okay.
    const origin = request.headers.get('origin') ?? 'none';
    const hasCsrfCookie = request.cookies.has(
      process.env.CSRF_COOKIE_NAME!
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          message: 'Auth API is healthy.',
          timestamp: new Date().toISOString(),
          security: {
            cors: {
              origin,
              status: 'Handled by middleware',
            },
            csrf: {
              cookiePresent: hasCsrfCookie,
              status: 'Checked, validation enforced on mutating endpoints.',
            },
          },
        },
      },
      {status: 200}
    );
  } catch (error) {
    console.error('[API_HEALTH_CHECK_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
