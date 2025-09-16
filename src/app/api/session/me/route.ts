
// src/app/api/session/me/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  mapStrapiError,
  respondWithError,
  getJwtFromCookie,
} from '@/lib/api-utils';

/**
 * Fetches the current user's data from Strapi if a valid session cookie is present.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get and verify JWT from the HttpOnly cookie
    const token = await getJwtFromCookie(request);
    if (!token) {
      return respondWithError('unauthorized', {details: 'No session cookie.'});
    }

    // 2. Fetch user data from Strapi using the token
    const strapiRes = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data
    });

    const strapiData = await strapiRes.json();

    if (!strapiRes.ok) {
      return mapStrapiError(strapiData);
    }

    // 3. Return sanitized user data
    const sanitizedUser = {
      id: strapiData.id,
      username: strapiData.username,
      email: strapiData.email,
    };

    return NextResponse.json({ok: true, data: sanitizedUser});
  } catch (error) {
    // This catches JWT verification errors or fetch failures
    if (
      error instanceof Error &&
      (error.message.includes('invalid') || error.message.includes('expired'))
    ) {
      return respondWithError('unauthorized', {details: error.message});
    }
    console.error('[API_ME_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
