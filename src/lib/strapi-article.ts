'use server';

import { performStrapiRequest } from './strapi-api';

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

        // Perform the update directly using the documentId
        const endpoint = `/api/articles/${documentId}?populate=*`;

        const response = await performStrapiRequest(endpoint, {
          method: 'PUT',
          body: JSON.stringify({ data: payload }),
        });

        console.log(`[strapi-article] Successfully updated article with documentId ${documentId}. Strapi responded with status 200.`);
        return response;

    } catch (error: any) {
        console.error(`[strapi-article] patchArticleByDocumentId: An error occurred for documentId ${documentId}.`, error);
        throw error;
    }
}