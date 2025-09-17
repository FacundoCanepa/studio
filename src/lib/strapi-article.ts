
'use server';

import { performStrapiRequest } from './strapi-api';

/**
 * Updates an article in Strapi using its documentId.
 * First, it finds the numeric ID from the documentId, then performs the update.
 * @param documentId - The v4 UUID of the article.
 * @param payload - The data to update.
 * @returns The updated article data.
 */
export async function patchArticleByDocumentId(documentId: string, payload: any): Promise<{ data: any }> {
    console.log(`[strapi-article] patchArticleByDocumentId: Attempting to update article with documentId: ${documentId}`);
    try {
        // Step 1: Find the numeric ID from the documentId
        const findParams = new URLSearchParams({ 'filters[documentId][$eq]': documentId });
        const findResponse = await performStrapiRequest(`/api/articles?${findParams.toString()}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const numericId = findResponse?.data?.[0]?.id;

        if (!numericId) {
            throw new Error(`Could not find numeric ID for article with documentId ${documentId}.`);
        }
        
        console.log(`[strapi-article] Found numeric ID ${numericId} for doc ${documentId}. Proceeding with update.`);

        // Step 2: Use the numeric ID to perform the PUT request
        const endpoint = `/api/articles/${numericId}?populate=*`;
        
        const response = await performStrapiRequest(endpoint, {
          method: 'PUT',
          body: JSON.stringify({ data: payload }),
        });
        
        console.log(`[strapi-article] Successfully updated article ID ${numericId}.`);
        return response;

    } catch (error: any) {
        console.error(`[strapi-article] patchArticleByDocumentId: An error occurred for documentId ${documentId}.`, error);
        throw error;
    }
}
