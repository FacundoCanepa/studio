
// src/app/api/session/set/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {z} from 'zod';
import {
  createSessionCookie,
  mapStrapiError,
  respondWithError,
} from '@/lib/api-utils';

const setSessionSchema = z.object({
  token: z.string().min(1, {message: 'El token es requerido.'}),
});

const STRAPI_URL = process.env.STRAPI_URL;

/**
 * Exchanges a social login access token (e.g., from Google) for a Strapi JWT.
 * It calls the Strapi provider's callback endpoint to perform the exchange.
 * If successful, it creates a secure, HttpOnly session cookie containing the Strapi JWT.
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

    const {token: googleAccessToken} = validated.data;
    console.log('[API_SESSION_SET] Google Access Token received (first 10 chars):', googleAccessToken.substring(0, 10));

    // 2. Exchange Google token for a Strapi JWT
    const exchangeUrl = `${STRAPI_URL}/api/connect/google?access_token=${googleAccessToken}`;
    console.log('[API_SESSION_SET] Calling Strapi to exchange token:', exchangeUrl);

    const strapiRes = await fetch(exchangeUrl, { cache: 'no-store' });
    const strapiData = await strapiRes.json();
    
    console.log(`[API_SESSION_SET] Strapi exchange response status: ${strapiRes.status}`);
    console.log('[API_SESSION_SET] Strapi exchange response data:', strapiData);

    if (!strapiRes.ok) {
        console.error('[API_SESSION_SET] Strapi token exchange failed.');
        // Use the error from the exchange response if available
        const errorMessage = strapiData.error?.message || 'Failed to validate social token with Strapi.';
        const errorCode = strapiData.error?.name === 'UnauthorizedError' ? 'unauthorized' : 'unknown_strapi_error';
        return NextResponse.json({ ok: false, error: { code: errorCode, message: errorMessage } }, { status: strapiRes.status });
    }

    const { jwt, user } = strapiData;
    if (!jwt || !user) {
      console.error('[API_SESSION_SET] Strapi response missing JWT or user data.');
      return respondWithError('unauthorized', {
        details: 'JWT o datos de usuario no encontrados en la respuesta de Strapi tras el intercambio.',
      });
    }
    
    console.log('[API_SESSION_SET] Strapi JWT received, creating session cookie.');

    // 3. Create HttpOnly session cookie with the Strapi JWT
    const cookie = await createSessionCookie(jwt);

    // 4. Return sanitized user data
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
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
