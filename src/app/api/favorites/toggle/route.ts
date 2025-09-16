
import {NextResponse, type NextRequest} from 'next/server';
import {
  API_BASE,
  mapStrapiError,
  respondWithError,
  getJwtFromCookie,
} from '@/lib/api-utils';
import type { StrapiUser } from '@/lib/strapi-types';

export async function POST(request: NextRequest) {
  console.log('\n[API_TOGGLE_FAVORITE] Received POST request.');
  try {
    const token = await getJwtFromCookie(request);
    if (!token) {
      console.error('[API_TOGGLE_FAVORITE] Unauthorized: No session cookie found.');
      return respondWithError('unauthorized', {details: 'No session cookie.'});
    }
    console.log('[API_TOGGLE_FAVORITE] JWT token found.');

    const body = await request.json();
    const { articleId } = body;
    if (!articleId) {
        console.error('[API_TOGGLE_FAVORITE] Validation Error: articleId is required.');
        return respondWithError('validation_error', { details: 'articleId is required.' });
    }
    console.log(`[API_TOGGLE_FAVORITE] Request to toggle favorite for articleId: ${articleId}`);


    // 1. Get current user with their favorites using the correct populate syntax
    const meUrl = `${API_BASE}/users/me?populate[favorite_articles]=true`;
    console.log(`[API_TOGGLE_FAVORITE] Fetching current user from Strapi: ${meUrl}`);
    const meResponse = await fetch(meUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });
    
    if (!meResponse.ok) {
        const meData = await meResponse.json().catch(() => null);
        console.error('[API_TOGGLE_FAVORITE] Failed to fetch user from Strapi.', { status: meResponse.status, body: meData });
        return mapStrapiError(meData);
    }
    const user: StrapiUser = await meResponse.json();
    console.log(`[API_TOGGLE_FAVORITE] Successfully fetched user: ${user.username} (ID: ${user.id})`);
    
    // 2. Determine if we are adding or removing the favorite
    const currentFavorites = user.favorite_articles?.map(a => a.id) || [];
    const isFavorite = currentFavorites.includes(articleId);
    console.log(`[API_TOGGLE_FAVORITE] Current favorites: [${currentFavorites.join(', ')}]. Is article ${articleId} a favorite? ${isFavorite}`);


    const newFavorites = isFavorite 
        ? currentFavorites.filter(id => id !== articleId)
        : [...currentFavorites, articleId];
    
    console.log(`[API_TOGGLE_FAVORITE] New favorites list will be: [${newFavorites.join(', ')}]`);


    // 3. Update the user in Strapi
    const updateUrl = `${API_BASE}/users/${user.id}`;
    const updatePayload = {
        favorite_articles: {
            set: newFavorites,
        },
    };
    console.log(`[API_TOGGLE_FAVORITE] Updating user in Strapi at ${updateUrl} with payload:`, JSON.stringify(updatePayload));
    
    const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
    });

    if (!updateResponse.ok) {
        const updateData = await updateResponse.json().catch(() => null);
        console.error('[API_TOGGLE_FAVORITE] Failed to update user in Strapi.', { status: updateResponse.status, body: updateData });
        return mapStrapiError(updateData);
    }

    const updatedUser: StrapiUser = await updateResponse.json();
    console.log('[API_TOGGLE_FAVORITE] Successfully updated user. New favorites:', updatedUser.favorite_articles?.map(a => a.id) || []);

    return NextResponse.json({
      ok: true,
      data: {
        message: 'Favorites updated successfully.',
        favoriteArticles: updatedUser.favorite_articles?.map(a => a.id) || [],
      },
    });

  } catch (error) {
    console.error('[API_TOGGLE_FAVORITE_ERROR] Unhandled exception:', error);
    return respondWithError('internal_server_error');
  }
}
