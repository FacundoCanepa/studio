
// src/app/api/session/set/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {z} from 'zod';
import {
  API_BASE,
  createSessionCookie,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';

const setSessionSchema = z.object({
  token: z.string().min(1, {message: 'El token es requerido.'}),
});


/**
 * Handles setting the session cookie after a successful social login redirect.
 * The frontend sends the `access_token` from the URL to this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validated = setSessionSchema.safeParse(body);
    if (!validated.success) {
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    const {token} = validated.data;

    // 2. Verify the access_token by fetching user data from Strapi
    const strapiRes = await fetch(`${API_BASE}/users/me`, {
      headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store',
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      // Map Strapi error, but default to 401 if status is missing
      const {status, ...errorResponse} = mapStrapiError(strapiData);
      return NextResponse.json(errorResponse, {status: status || 401});
    }

    // 3. Create HttpOnly session cookie
    const cookie = await createSessionCookie(token);

    // 4. Return sanitized user data
    const sanitizedUser = {
      id: strapiData.id,
      username: strapiData.username,
      email: strapiData.email,
    };

    const response = NextResponse.json({ok: true, data: sanitizedUser});
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_SESSION_SET_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
