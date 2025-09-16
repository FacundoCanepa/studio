
// src/app/api/session/logout/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {clearSessionCookie, respondWithError} from '@/lib/api-utils';
import { validateCsrf } from '@/lib/api/csrf';


export async function POST(request: NextRequest) {
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

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
