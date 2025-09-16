
// src/app/api/csrf/route.ts
import {NextResponse} from 'next/server';
import {createCsrfToken, createCsrfCookie} from '@/lib/api/csrf';
import {respondWithError} from '@/lib/api-utils';

/**
 * This endpoint is now primarily for generating a token that is stored
 * in an HttpOnly cookie. The frontend no longer needs to read the token
 * directly. The browser will handle sending the cookie.
 */
export async function GET() {
  try {
    const token = await createCsrfToken();
    const cookie = createCsrfCookie(token);

    // We send back the same token in the body.
    // This allows a pattern where the frontend can use this token
    // for the x-csrf-token header.
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
