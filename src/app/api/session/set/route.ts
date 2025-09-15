
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
  console.log('[API_SESSION_SET] Received request.');
  try {
    // 1. Validate request body
    const body = await request.json();
    console.log('[API_SESSION_SET] Request body:', body);
    const validated = setSessionSchema.safeParse(body);
    if (!validated.success) {
      console.error('[API_SESSION_SET] Validation failed:', validated.error);
      return respondWithError('validation_error', {
        issues: validated.error.flatten().fieldErrors,
      });
    }

    const {token} = validated.data;
    console.log('[API_SESSION_SET] Validated token (first 10 chars):', token.substring(0, 10));

    // 2. Verify the access_token by fetching user data from Strapi
    console.log('[API_SESSION_SET] Verifying token with Strapi /api/users/me');
    const strapiRes = await fetch(`${API_BASE}/users/me`, {
      headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store',
    });

    const strapiData = await strapiRes.json();
    console.log(`[API_SESSION_SET] Strapi response status: ${strapiRes.status}`);
    console.log('[API_SESSION_SET] Strapi response data:', strapiData);


    if (!strapiRes.ok) {
      console.error('[API_SESSION_SET] Strapi verification failed.');
      return mapStrapiError(strapiData);
    }

    // 3. Create HttpOnly session cookie
    console.log('[API_SESSION_SET] Creating session cookie.');
    const cookie = await createSessionCookie(token);

    // 4. Return sanitized user data
    const sanitizedUser = {
      id: strapiData.id,
      username: strapiData.username,
      email: strapiData.email,
    };
    console.log('[API_SESSION_SET] Session successfully created for user:', sanitizedUser);

    const response = NextResponse.json({ok: true, data: sanitizedUser});
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[API_SESSION_SET_ERROR] Unhandled exception:', error);
    return respondWithError('internal_server_error');
  }
}
