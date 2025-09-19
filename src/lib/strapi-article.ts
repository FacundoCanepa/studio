'use server';

import { qs } from './qs';
import { performStrapiRequest } from './strapi-api';
import {
    ARTICLE_FIELDS,
    AUTHOR_AVATAR_FIELDS,
    AUTHOR_FIELDS,
    CATEGORY_FIELDS,
    COVER_FIELDS,
    TAG_FIELDS,
} from './strapi-article-fields';

/**
 * Updates an article in Strapi using its documentId.
 * Validates the article exists and performs the update directly via its documentId endpoint.
 * @param documentId - The v4 UUID of the article.
 * @param payload - The data to update.
 * @returns The updated article data.
 */
export async function patchArticleByDocumentId(documentId: string, payload: any): Promise<{ data: any }> {
    console.log(`[strapi-article] patchArticleByDocumentId: Attempting to update article with documentId: ${documentId}`);
    try {
        // Validate that the article exists for the provided documentId
        const findParams = new URLSearchParams({ 'filters[documentId][$eq]': documentId });
        // enforced pagination to reduce API calls
        findParams.set('pagination[page]', '1');
        findParams.set('pagination[pageSize]', '12');
        const validationResponse = await performStrapiRequest(`/api/articles?${findParams.toString()}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!validationResponse?.data?.length) {
            throw new Error(`No article found for documentId ${documentId}.`);
        }

        console.log(`[strapi-article] Verified existence for documentId ${documentId}. Updating via documentId endpoint.`);

           // Perform the update directly using the documentId. Strapi's document update
        // endpoint does not support passing fields/populate parameters alongside the
        // PUT request body, so we first send the update and then fetch the hydrated
        // entity in a separate call.
        const updateEndpoint = `/api/articles/${documentId}`;
        await performStrapiRequest(updateEndpoint, {
          method: 'PUT',
          body: JSON.stringify({ data: payload }),
        });
        const query = qs({
          fields: ARTICLE_FIELDS,
          populate: {
            Cover: {
              fields: COVER_FIELDS,
            },
            category: {
              fields: CATEGORY_FIELDS,
            },
            author: {
              fields: AUTHOR_FIELDS,
              populate: {
                Avatar: {
                  fields: AUTHOR_AVATAR_FIELDS,
                },
              },
            },
            tags: {
              fields: TAG_FIELDS,
            },
          },
        });


        const fetchEndpoint = `/api/articles/${documentId}${query}`;
        const response = await performStrapiRequest(fetchEndpoint, {
          method: 'GET',
          cache: 'no-store',
        });

        console.log(`[strapi-article] Successfully updated article with documentId ${documentId}.`);

    } catch (error: any) {
        console.error(`[strapi-article] patchArticleByDocumentId: An error occurred for documentId ${documentId}.`, error);
        throw error;
    }
}

// Endpoints touched by this module:
// - GET /api/articles?filters[documentId][$eq]=:documentId&pagination[page]=1&pagination[pageSize]=12
// - PUT /api/articles/:documentId
// - GET /api/articles/:documentId (with explicit fields & populate query)