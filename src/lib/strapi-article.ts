// src/lib/strapi-article.ts
'use server';

import { STRAPI_API_TOKEN } from './strapi-media-config';
import { performStrapiRequest } from './strapi-api';

/**
 * Returns the authorization headers for Strapi API requests.
 */
function authHeaders() {
  if (!STRAPI_API_TOKEN) {
    throw new Error('[strapi-article] STRAPI_API_TOKEN is not configured.');
  }
  return {
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
  };
}

/**
 * Fetches a single article from Strapi using its numeric ID.
 * This is now an internal function as we prefer documentId for public operations.
 * @param articleId - The numeric ID of the article.
 * @returns The full article data from Strapi.
 */
async function getArticleById(articleId: number): Promise<{ data: any }> {
    const findEndpoint = `/api/articles/${articleId}?populate=*`;
    try {
        const response = await performStrapiRequest(findEndpoint, {
            method: 'GET',
            headers: authHeaders(),
            cache: 'no-store',
        });
        if (!response.data) {
             throw new Error(`Article with numeric ID ${articleId} not found.`);
        }
        return response;
    } catch (error: any) {
         console.error(`[strapi-article] getArticleById: Failed to fetch article for ID ${articleId}.`, {
            message: error.message,
        });
        throw new Error(`Failed to retrieve article: ${error.message}`);
    }
}


/**
 * Fetches a single article from Strapi using its documentId.
 * @param documentId - The v4 UUID of the article.
 * @returns The full article data from Strapi, or null if not found.
 */
export async function getArticleByDocumentId(documentId: string): Promise<{ data: any } | null> {
  console.log(`[strapi-article] getArticleByDocumentId: Fetching article with documentId: ${documentId}`);
  
  const findParams = new URLSearchParams({
    'filters[documentId][$eq]': documentId,
    'populate': '*',
  });

  const findEndpoint = `/api/articles?${findParams.toString()}`;
  
  try {
    const findResponse = await performStrapiRequest(findEndpoint, {
      method: 'GET',
      headers: authHeaders(),
      cache: 'no-store',
    });

    const article = findResponse.data?.[0];

    if (!article) {
      console.warn(`[strapi-article] getArticleByDocumentId: No article found for documentId: ${documentId}`);
      return null;
    }

    console.log(`[strapi-article] getArticleByDocumentId: Found article with numeric ID ${article.id}`);
    // Once found, we fetch the single type by its numeric ID to ensure we get all data consistently
    return await getArticleById(article.id);

  } catch (error: any) {
    console.error(`[strapi-article] getArticleByDocumentId: Failed to fetch article for documentId ${documentId}.`, {
      message: error.message,
    });
    // Return null instead of throwing to allow graceful failure
    return null;
  }
}


/**
 * Updates an article in Strapi using its documentId.
 * The payload should contain the fields to be updated.
 * @param documentId - The v4 UUID of the article.
 * @param payload - The data to update.
 * @returns The updated article data.
 */
export async function patchArticleByDocumentId(documentId: string, payload: any): Promise<{ data: any }> {
    console.log(`[strapi-article] patchArticleByDocumentId: Attempting to update article with documentId: ${documentId}`);
    try {
        const articleResponse = await getArticleByDocumentId(documentId);
        const numericId = articleResponse?.data?.id;

        if (!numericId) {
            throw new Error(`Could not find numeric ID for article with documentId ${documentId}.`);
        }

        const endpoint = `/api/articles/${numericId}?populate=*`;
        console.log(`[strapi-article] patchArticleById: Updating article ID ${numericId} at endpoint: ${endpoint}`);

        const response = await performStrapiRequest(endpoint, {
          method: 'PUT',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: payload }),
        });
        console.log(`[strapi-article] patchArticleById: Successfully updated article ID ${numericId}.`);
        return response;

    } catch (error: any) {
        console.error(`[strapi-article] patchArticleByDocumentId: An error occurred during the update process for documentId ${documentId}.`, error);
        throw error;
    }
}


/**
 * Sets or unsets the cover image for an article.
 * @param documentId - The v4 UUID of the article.
 * @param assetId - The numeric ID of the media asset, or null to remove the cover.
 */
export async function setCoverByDocumentId(documentId: string, assetId: number | null): Promise<{ data: any }> {
  console.log(`[strapi-article] setCoverByDocumentId: Setting cover for documentId ${documentId} to assetId ${assetId}`);
  return patchArticleByDocumentId(documentId, { Cover: assetId });
}

/**
 * Sets the carousel images for an article.
 * @param documentId - The v4 UUID of the article.
 * @param assetIds - An array of numeric IDs of the media assets.
 */
export async function setCarouselByDocumentId(documentId: string, assetIds: number[]): Promise<{ data: any }> {
  console.log(`[strapi-article] setCarouselByDocumentId: Setting carousel for documentId ${documentId} with assetIds:`, assetIds);
  return patchArticleByDocumentId(documentId, { Carosel: assetIds });
}
