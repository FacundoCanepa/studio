// src/app/api/csrf/route.ts
import {NextResponse} from 'next/server';
import {createCsrfToken, createCsrfCookie} from '@/lib/api/csrf';
import {respondWithError} from '@/lib/api-utils';

/**
 * Generates a new CSRF token and sets it as a non-HttpOnly cookie.
 * The client-side code calls this endpoint to get a token for inclusion
 * in the 'x-csrf-token' header of subsequent mutating requests.
 */
export async function GET() {
  try {
    const token = await createCsrfToken();
    const cookie = createCsrfCookie(token);

    const response = NextResponse.json({ok: true, data: {token}});
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_CSRF_ERROR]', error);
    return respondWithError('internal_server_error', {
      details: 'Failed to generate CSRF token.',
    });
  }
}
