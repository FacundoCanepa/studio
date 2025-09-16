
// src/app/api/session/set/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {z} from 'zod';
import {
  createSessionCookie,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';
import { validateCsrf } from '@/lib/api/csrf';

const setSessionSchema = z.object({
  token: z.string().min(1, {message: 'El token es requerido.'}),
});

const STRAPI_URL = process.env.STRAPI_URL;

export async function POST(request: NextRequest) {
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const validated = setSessionSchema.safeParse(body);

    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    const {token: googleAccessToken} = validated.data;
    const exchangeUrl = `${STRAPI_URL}/api/connect/google?access_token=${googleAccessToken}`;
    
    const strapiRes = await fetch(exchangeUrl, { cache: 'no-store' });
    const strapiData = await strapiRes.json();
    
    if (!strapiRes.ok) {
        const errorMessage = strapiData.error?.message || 'Failed to validate social token with Strapi.';
        const errorCode = strapiData.error?.name === 'UnauthorizedError' ? 'unauthorized' : 'unknown_strapi_error';
        return NextResponse.json({ ok: false, error: { code: errorCode, message: errorMessage } }, { status: strapiRes.status });
    }

    const { jwt, user } = strapiData;
    if (!jwt || !user) {
      return respondWithError('unauthorized', {
        details: 'JWT o datos de usuario no encontrados en la respuesta de Strapi tras el intercambio.',
      });
    }
    
    const cookie = await createSessionCookie(jwt);

    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const response = NextResponse.json({ok: true, data: sanitizedUser});
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_SESSION_SET_ERROR] Unhandled exception:', error);
    return respondWithError('internal_server_error');
  }
}
