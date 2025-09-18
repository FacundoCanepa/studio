
// src/app/api/session/me/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  mapStrapiError,
  respondWithError,
  getJwtFromCookie,
} from '@/lib/api-utils';
import type { StrapiUser } from '@/lib/strapi-types';

/**
 * Fetches the current user's data from Strapi if a valid session cookie is present.
 */
export async function GET(request: NextRequest) {
  console.log('[API_ME] Received GET request.');
  try {
    const token = await getJwtFromCookie(request);
    if (!token) {
      console.warn('[API_ME] No session cookie found.');
      return respondWithError('unauthorized', {details: 'No session cookie.'});
    }
    if (!API_BASE) {
      console.error('[API_ME] NEXT_PUBLIC_STRAPI_URL is not configured.');
      return respondWithError('internal_server_error', {
        details: 'Configuración incompleta del servidor: NEXT_PUBLIC_STRAPI_URL no está definida.',
      });
    }
    console.log(`[API_ME] Token found. Fetching user data from Strapi...`);
    // Correctly populate favorite_articles, favorite_tags, and role
    const strapiRes = await fetch(`${API_BASE}/users/me?populate[favorite_articles]=true&populate[favorite_tags]=true&populate[role]=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data
    });

    const strapiData: StrapiUser = await strapiRes.json();
    console.log('[API_ME] Strapi response status:', strapiRes.status);


    if (!strapiRes.ok) {
      console.error('[API_ME] Strapi returned an error.', { status: strapiRes.status, body: JSON.stringify(strapiData, null, 2) });
      return mapStrapiError(strapiData);
    }
    
    console.log('[API_ME] Raw user data from Strapi:', JSON.stringify(strapiData, null, 2));

    const sanitizedUser = {
      id: strapiData.id,
      username: strapiData.username,
      email: strapiData.email,
      role: strapiData.role?.name || 'Authenticated',
      favoriteArticles: strapiData.favorite_articles?.map(a => a.id) || [],
      favoriteTags: strapiData.favorite_tags?.map(t => t.id) || [],
    };
    
    console.log('[API_ME] Sanitized user data being sent to client:', JSON.stringify(sanitizedUser, null, 2));


    return NextResponse.json({ok: true, data: sanitizedUser});
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('invalid') || error.message.includes('expired'))
    ) {
       console.warn('[API_ME] JWT validation error:', error.message);
      return respondWithError('unauthorized', {details: error.message});
    }
    console.error('[API_ME][EXCEPTION]', error);
    return respondWithError('internal_server_error');
  }
}
