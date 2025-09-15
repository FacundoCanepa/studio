// src/app/api/session/login/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  loginSchema,
  createSessionCookie,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';

/**
 * Handles user login by proxying credentials to Strapi, and if successful,
 * creates an HttpOnly session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    // 2. Proxy login request to Strapi
    const strapiRes = await fetch(`${API_BASE}/auth/local`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(validated.data),
      cache: 'no-store',
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      return mapStrapiError(strapiData);
    }

    const {jwt, user} = strapiData;
    if (!jwt || !user) {
      return respondWithError('unauthorized', {
        details: 'JWT o datos del usuario no encontrados en la respuesta de Strapi.',
      });
    }

    // 3. Create session cookie
    const cookie = await createSessionCookie(jwt);

    // 4. Sanitize user data for the response
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const response = NextResponse.json({ok: true, data: sanitizedUser});
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_LOGIN_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
