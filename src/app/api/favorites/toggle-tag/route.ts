
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  mapStrapiError,
  respondWithError,
  getJwtFromCookie,
} from '@/lib/api-utils';
import type { StrapiUser } from '@/lib/strapi-types';

export async function POST(request: NextRequest) {
  try {
    const token = await getJwtFromCookie(request);
    if (!token) {
      return respondWithError('unauthorized', {details: 'No session cookie.'});
    }

    const { tagId } = await request.json();
    if (!tagId) {
        return respondWithError('validation_error', { details: 'tagId is required.' });
    }

    // 1. Get current user with their favorite tags
    const meResponse = await fetch(`${API_BASE}/users/me?populate[favorite_tags]=true`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!meResponse.ok) {
        const meData = await meResponse.json().catch(() => null);
        return mapStrapiError(meData);
    }
    const user: StrapiUser = await meResponse.json();
    
    // 2. Determine if we are adding or removing the favorite
    const currentFavorites = user.favorite_tags?.map(t => t.id) || [];
    const isFavorite = currentFavorites.includes(tagId);

    const newFavorites = isFavorite 
        ? currentFavorites.filter(id => id !== tagId)
        : [...currentFavorites, tagId];

    // 3. Update the user in Strapi
    const updateResponse = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            favorite_tags: {
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
        message: 'Favorite tags updated successfully.',
        favoriteTags: updatedUser.favorite_tags?.map(t => t.id) || [],
      },
    });

  } catch (error) {
    console.error('[API_TOGGLE_FAVORITE_TAG_ERROR]', error);
    return respondWithError('internal_server_error');
  }
}
