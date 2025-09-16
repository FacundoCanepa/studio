
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  mapStrapiError,
  respondWithError,
  getJwtFromCookie,
} from '@/lib/api-utils';
import { validateCsrf } from '@/lib/api/csrf';
import type { StrapiUser } from '@/lib/strapi-types';

export async function POST(request: NextRequest) {
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const token = await getJwtFromCookie(request);
    if (!token) {
      return respondWithError('unauthorized', {details: 'No session cookie.'});
    }

    const { articleId } = await request.json();
    if (!articleId) {
        return respondWithError('validation_error', { details: 'articleId is required.' });
    }

    // 1. Get current user with their favorites
    const meResponse = await fetch(`${API_BASE}/users/me?populate[favorite_articles]=true`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!meResponse.ok) {
        const meData = await meResponse.json().catch(() => null);
        return mapStrapiError(meData);
    }
    const user: StrapiUser = await meResponse.json();
    
    // 2. Determine if we are adding or removing the favorite
    const currentFavorites = user.favorite_articles?.map(a => a.id) || [];
    const isFavorite = currentFavorites.includes(articleId);

    const newFavorites = isFavorite 
        ? currentFavorites.filter(id => id !== articleId)
        : [...currentFavorites, articleId];

    // 3. Update the user in Strapi
    const updateResponse = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            favorite_articles: {
                set: newFavorites,
            },
        }),
    });

    if (!updateResponse.ok) {
        const updateData = await updateResponse.json().catch(() => null);
        return mapStrapiError(updateData);
    }

    const updatedUser: StrapiUser = await updateResponse.json();

    return NextResponse.json({
      ok: true,
      data: {
        message: 'Favorites updated successfully.',
        favoriteArticles: updatedUser.favorite_articles?.map(a => a.id) || [],
      },
    });

  } catch (error) {
    console.error('[API_TOGGLE_FAVORITE_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
