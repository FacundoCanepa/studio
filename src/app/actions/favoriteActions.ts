
// src/app/actions/favoriteActions.ts
'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { API_BASE, COOKIE_NAME, COOKIE_SECRET } from '@/lib/api-utils';
import type { StrapiUser } from '@/lib/strapi-types';

async function getJwtFromServerAction(): Promise<string | null> {
  console.log('[SERVER_ACTION] Attempting to get JWT from cookie...');
  const cookie = cookies().get(COOKIE_NAME)?.value;
  if (!cookie) {
    console.error('[SERVER_ACTION] JWT cookie not found.');
    return null;
  }
  console.log('[SERVER_ACTION] JWT cookie found.');

  try {
    const { payload } = await jwtVerify(cookie, COOKIE_SECRET);
    if (typeof payload.token === 'string') {
      console.log('[SERVER_ACTION] JWT verified successfully.');
      return payload.token;
    }
    console.error('[SERVER_ACTION] Token not found in JWT payload.');
    return null;
  } catch (error) {
    console.error('[SERVER_ACTION_ERROR] JWT verification failed:', (error as Error).message);
    return null;
  }
}

export async function toggleFavoriteAction(articleId: number) {
  console.log(`[TOGGLE_FAVORITE_ACTION] Received request for articleId: ${articleId}`);
  const userToken = await getJwtFromServerAction();
  if (!userToken) {
    throw new Error('Authentication required.');
  }
  console.log(`[TOGGLE_FAVORITE_ACTION] Using user token for reading: ${userToken.substring(0, 15)}...`);

  const meUrl = `${API_BASE}/users/me?populate[favorite_articles]=true`;
  console.log(`[TOGGLE_FAVORITE_ACTION] Fetching current user from: ${meUrl}`);
  const meResponse = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${userToken}` },
      cache: 'no-store',
  });

  if (!meResponse.ok) {
    const errorBody = await meResponse.text().catch(() => 'Could not parse error body');
    console.error('[TOGGLE_FAVORITE_ACTION_ERROR] Failed to fetch user from Strapi.', {
        status: meResponse.status,
        body: errorBody,
    });
    throw new Error('Could not fetch user.');
  }

  const user: StrapiUser = await meResponse.json();
  console.log('[TOGGLE_FAVORITE_ACTION] Successfully fetched user:', user.username);
  
  const currentFavorites = user.favorite_articles?.map(a => a.id) || [];
  console.log('[TOGGLE_FAVORITE_ACTION] Current favorite article IDs:', currentFavorites);

  const isFavorite = currentFavorites.includes(articleId);
  console.log(`[TOGGLE_FAVORITE_ACTION] Is article ${articleId} currently a favorite? ${isFavorite}`);

  const newFavorites = isFavorite
    ? currentFavorites.filter(id => id !== articleId)
    : [...currentFavorites, articleId];
  console.log('[TOGGLE_FAVORITE_ACTION] New favorite article IDs to be saved:', newFavorites);

  const payload = {
    favorite_articles: newFavorites
  };

  const updateUrl = `${API_BASE}/users/${user.id}?populate=favorite_articles`;
  console.log(`[TOGGLE_FAVORITE_ACTION] Preparing to PUT to: ${updateUrl}`);
  console.log('[TOGGLE_FAVORITE_ACTION] Payload to be sent:', JSON.stringify(payload, null, 2));

  // *** SOLUTION: Use Admin Token for the write operation ***
  const adminToken = process.env.STRAPI_API_TOKEN;
  if (!adminToken) {
    console.error('[SERVER_ACTION_UPDATE_ERROR] STRAPI_API_TOKEN is not configured.');
    throw new Error('Server configuration error.');
  }
  console.log('[TOGGLE_FAVORITE_ACTION] Using ADMIN token for writing.');

  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`, // Use the admin token here
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!updateResponse.ok) {
    const errorBody = await updateResponse.text().catch(() => '{}');
    console.error('[SERVER_ACTION_UPDATE_ERROR] Failed to update user in Strapi.', {
      status: updateResponse.status,
      body: errorBody,
    });
    throw new Error('Failed to update favorites in Strapi.');
  }
  
  const updatedUser: StrapiUser = await updateResponse.json();
  console.log('[SERVER_ACTION_SUCCESS] Successfully updated user. The response from Strapi does not contain the updated list, but the operation was successful.');

  // Return the list we KNOW is correct, because we just sent it.
  return {
    favoriteArticles: newFavorites,
  };
}

export async function toggleTagFavoriteAction(tagId: number) {
  console.log(`[TOGGLE_TAG_ACTION] Received request for tagId: ${tagId}`);
  const userToken = await getJwtFromServerAction();
  if (!userToken) {
    throw new Error('Authentication required.');
  }
  console.log(`[TOGGLE_TAG_ACTION] Using user token for reading: ${userToken.substring(0, 15)}...`);
  
  const meUrl = `${API_BASE}/users/me?populate[favorite_tags]=true`;
  console.log(`[TOGGLE_TAG_ACTION] Fetching current user from: ${meUrl}`);
  const meResponse = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${userToken}` },
      cache: 'no-store',
  });

  if (!meResponse.ok) {
     const errorBody = await meResponse.text().catch(() => 'Could not parse error body');
    console.error('[TOGGLE_TAG_ACTION_ERROR] Failed to fetch user from Strapi.', {
        status: meResponse.status,
        body: errorBody,
    });
    throw new Error('Could not fetch user.');
  }
  const user: StrapiUser = await meResponse.json();
  console.log('[TOGGLE_TAG_ACTION] Successfully fetched user:', user.username);

  const currentFavorites = user.favorite_tags?.map(t => t.id) || [];
  console.log('[TOGGLE_TAG_ACTION] Current favorite tag IDs:', currentFavorites);
  
  const isFavorite = currentFavorites.includes(tagId);
  console.log(`[TOGGLE_TAG_ACTION] Is tag ${tagId} currently a favorite? ${isFavorite}`);

  const newFavorites = isFavorite
    ? currentFavorites.filter(id => id !== tagId)
    : [...currentFavorites, tagId];
  console.log('[TOGGLE_TAG_ACTION] New favorite tag IDs to be saved:', newFavorites);
  
  const payload = {
    favorite_tags: newFavorites
  };

  const updateUrl = `${API_BASE}/users/${user.id}?populate=favorite_tags`;
  console.log(`[TOGGLE_TAG_ACTION] Preparing to PUT to: ${updateUrl}`);
  console.log('[TOGGLE_TAG_ACTION] Payload to be sent:', JSON.stringify(payload, null, 2));

  const adminToken = process.env.STRAPI_API_TOKEN;
  if (!adminToken) {
    console.error('[SERVER_ACTION_UPDATE_ERROR] STRAPI_API_TOKEN is not configured.');
    throw new Error('Server configuration error.');
  }
  console.log('[TOGGLE_TAG_ACTION] Using ADMIN token for writing.');
  
  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`, // Use the admin token here
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!updateResponse.ok) {
    const errorBody = await updateResponse.text().catch(() => '{}');
    console.error('[SERVER_ACTION_UPDATE_ERROR] Failed to update tag favorites in Strapi.', {
      status: updateResponse.status,
      body: errorBody,
    });
    throw new Error('Failed to update tag favorites in Strapi.');
  }

  console.log('[SERVER_ACTION_SUCCESS] Successfully updated tag favorites.');

  // Return the list we KNOW is correct.
  return {
    favoriteTags: newFavorites,
  };
}
