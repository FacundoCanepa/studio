
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
  try {
    const token = await getJwtFromCookie(request);
    if (!token) {
      return respondWithError('unauthorized', {details: 'No session cookie.'});
    }

    // Correctly populate favorite_articles
    const strapiRes = await fetch(`${API_BASE}/users/me?populate[favorite_articles]=true&populate[favorite_tags]=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data
    });

    const strapiData: StrapiUser = await strapiRes.json();

    if (!strapiRes.ok) {
      return mapStrapiError(strapiData);
    }

    const sanitizedUser = {
      id: strapiData.id,
      username: strapiData.username,
      email: strapiData.email,
      favoriteArticles: strapiData.favorite_articles?.map(a => a.id) || [],
      favoriteTags: strapiData.favorite_tags?.map(t => t.id) || [],
    };

    return NextResponse.json({ok: true, data: sanitizedUser});
  } catch (error) {
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
