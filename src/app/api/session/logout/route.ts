// src/app/api/session/logout/route.ts
import {NextResponse} from 'next/server';
import {clearSessionCookie, respondWithError} from '@/lib/api-utils';

/**
 * Clears the user's session cookie, effectively logging them out.
 */
export async function POST() {
  try {
    const cookie = clearSessionCookie();
    const response = NextResponse.json({
      ok: true,
      data: {message: 'Cierre de sesión exitoso.'},
    });
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('[API_LOGOUT_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
