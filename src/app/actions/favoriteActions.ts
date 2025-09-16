
// src/app/actions/favoriteActions.ts
'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { API_BASE, COOKIE_NAME, COOKIE_SECRET } from '@/lib/api-utils';
import type { StrapiUser } from '@/lib/strapi-types';

async function getJwtFromServerAction(): Promise<string | null> {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, COOKIE_SECRET);
    if (typeof payload.token === 'string') {
      return payload.token;
    }
    return null;
  } catch (error) {
    console.warn('[JWT_VERIFY_ERROR_ACTION]', (error as Error).message);
    return null;
  }
}

export async function toggleFavoriteAction(articleId: number) {
  console.log(`[TOGGLE_FAVORITE_ACTION] Received request for articleId: ${articleId}`);
  const token = await getJwtFromServerAction();
  if (!token) {
    throw new Error('Authentication required.');
  }

  const meResponse = await fetch(`${API_BASE}/users/me?populate[favorite_articles]=id`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
  });

  if (!meResponse.ok) {
    const errorBody = await meResponse.json().catch(() => ({ message: 'Could not parse error body' }));
    console.error('[TOGGLE_FAVORITE_ACTION_ERROR] Failed to fetch user from Strapi.', {
        status: meResponse.status,
        body: errorBody,
    });
    throw new Error('Could not fetch user.');
  }
  const user: StrapiUser = await meResponse.json();
  
  const currentFavorites = user.favorite_articles?.map(a => a.id) || [];
  const isFavorite = currentFavorites.includes(articleId);

  const newFavorites = isFavorite
    ? currentFavorites.filter(id => id !== articleId)
    : [...currentFavorites, articleId];

  const payload = {
    favorite_articles: newFavorites
  };

  const updateUrl = `${API_BASE}/users/${user.id}`;
  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!updateResponse.ok) {
    const errorBody = await updateResponse.json().catch(() => ({}));
    console.error('[SERVER_ACTION_UPDATE_ERROR] Failed to update user in Strapi.', {
      status: updateResponse.status,
      body: errorBody,
    });
    throw new Error('Failed to update favorites in Strapi.');
  }
  
  const updatedUser: StrapiUser = await updateResponse.json();
  console.log('[SERVER_ACTION_SUCCESS] Successfully updated user.');

  return {
    favoriteArticles: updatedUser.favorite_articles?.map(a => a.id) || [],
  };
}

export async function toggleTagFavoriteAction(tagId: number) {
  console.log(`[TOGGLE_TAG_ACTION] Received request for tagId: ${tagId}`);
  const token = await getJwtFromServerAction();
  if (!token) {
    throw new Error('Authentication required.');
  }
  
  const meResponse = await fetch(`${API_BASE}/users/me?populate[favorite_tags]=id`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
  });

  if (!meResponse.ok) {
     const errorBody = await meResponse.json().catch(() => ({ message: 'Could not parse error body' }));
    console.error('[TOGGLE_TAG_ACTION_ERROR] Failed to fetch user from Strapi.', {
        status: meResponse.status,
        body: errorBody,
    });
    throw new Error('Could not fetch user.');
  }
  const user: StrapiUser = await meResponse.json();

  const currentFavorites = user.favorite_tags?.map(t => t.id) || [];
  const isFavorite = currentFavorites.includes(tagId);

  const newFavorites = isFavorite
    ? currentFavorites.filter(id => id !== tagId)
    : [...currentFavorites, tagId];
  
  const payload = {
    favorite_tags: newFavorites
  };
  
  const updateUrl = `${API_BASE}/users/${user.id}`;
  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!updateResponse.ok) {
    const errorBody = await updateResponse.json().catch(() => ({}));
    console.error('[SERVER_ACTION_UPDATE_ERROR] Failed to update tag favorites in Strapi.', {
      status: updateResponse.status,
      body: errorBody,
    });
    throw new Error('Failed to update tag favorites in Strapi.');
  }

  const updatedUser: StrapiUser = await updateResponse.json();
  console.log('[SERVER_ACTION_SUCCESS] Successfully updated tag favorites.');

  return {
    favoriteTags: updatedUser.favorite_tags?.map(t => t.id) || [],
  };
}
