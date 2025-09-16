// src/app/actions/favoriteActions.ts
'use server';

import { cookies } from 'next/headers';
import { API_BASE, getJwtFromCookie } from '@/lib/api-utils';
import type { StrapiUser } from '@/lib/strapi-types';

async function performStrapiUpdate(userId: number, token: string, payload: object) {
  const updateUrl = `${API_BASE}/users/${userId}`;
  
  console.log(`[SERVER_ACTION] Updating user ${userId} at ${updateUrl}`);

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
    console.error('[SERVER_ACTION_ERROR] Failed to update user in Strapi.', {
      status: updateResponse.status,
      body: errorBody,
    });
    throw new Error('Failed to update favorites in Strapi.');
  }

  const updatedUser: StrapiUser = await updateResponse.json();
  console.log('[SERVER_ACTION_SUCCESS] Successfully updated user.');
  return updatedUser;
}

async function getFavorites(token: string): Promise<{ articleIds: number[], tagIds: number[] }> {
    const meUrl = `${API_BASE}/users/me?populate[favorite_articles]=id&populate[favorite_tags]=id`;
    console.log(`[SERVER_ACTION] Fetching current user from Strapi: ${meUrl}`);
    const meResponse = await fetch(meUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });

    if (!meResponse.ok) {
        throw new Error('Could not fetch user data.');
    }
    const user: StrapiUser = await meResponse.json();
    return {
        articleIds: user.favorite_articles?.map(a => a.id) || [],
        tagIds: user.favorite_tags?.map(t => t.id) || [],
    };
}


export async function toggleFavoriteAction(articleId: number) {
  console.log(`[TOGGLE_FAVORITE_ACTION] Received request for articleId: ${articleId}`);
  const token = await getJwtFromCookie({ cookies } as any);
  if (!token) {
    throw new Error('Authentication required.');
  }

  const meResponse = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
  });
  if (!meResponse.ok) throw new Error('Could not fetch user.');
  const user: StrapiUser = await meResponse.json();
  
  const currentFavorites = user.favorite_articles?.map(a => a.id) || [];
  const isFavorite = currentFavorites.includes(articleId);

  const newFavorites = isFavorite
    ? currentFavorites.filter(id => id !== articleId)
    : [...currentFavorites, articleId];

  const updatedUser = await performStrapiUpdate(user.id, token, {
    favorite_articles: { set: newFavorites },
  });

  return {
    favoriteArticles: updatedUser.favorite_articles?.map(a => a.id) || [],
  };
}

export async function toggleTagFavoriteAction(tagId: number) {
  console.log(`[TOGGLE_TAG_ACTION] Received request for tagId: ${tagId}`);
  const token = await getJwtFromCookie({ cookies } as any);
  if (!token) {
    throw new Error('Authentication required.');
  }
  
  const meResponse = await fetch(`${API_BASE}/users/me?populate[favorite_tags]=id`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
  });
  if (!meResponse.ok) throw new Error('Could not fetch user.');
  const user: StrapiUser = await meResponse.json();

  const currentFavorites = user.favorite_tags?.map(t => t.id) || [];
  const isFavorite = currentFavorites.includes(tagId);

  const newFavorites = isFavorite
    ? currentFavorites.filter(id => id !== tagId)
    : [...currentFavorites, tagId];

  const updatedUser = await performStrapiUpdate(user.id, token, {
    favorite_tags: { set: newFavorites },
  });

  return {
    favoriteTags: updatedUser.favorite_tags?.map(t => t.id) || [],
  };
}