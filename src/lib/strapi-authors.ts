
'use server';

import { fetchStrapi } from './strapi-api';
import { qs } from './qs';

/**
 * =================================================================================
 * IMPORTANT: Always use `documentId` (the v4 UUID) for API operations.
 * The numeric `id` is an internal Strapi detail and should not be used for
 * fetching, updating, or deleting records to maintain data consistency.
 * =================================================================================
 */

export type AuthorPayload = {
  name: string;
  slug: string;
  bio?: string;
  role?: string;
  avatarUrl?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  isActive: boolean;
  featured?: boolean;
};

export type AuthorDoc = AuthorPayload & {
  documentId: string;
  createdAt: string;
  updatedAt: string;
};

interface ListAuthorsParams {
    page?: number;
    pageSize?: number;
    search?: string;
}

/**
 * Lists authors from Strapi with pagination and search.
 */
export async function listAuthors({ page = 1, pageSize = 20, search = '' }: ListAuthorsParams = {}) {
    const queryParams: Record<string, any> = {
        sort: 'updatedAt:desc',
        pagination: { page, pageSize },
        populate: '*',
    };

    if (search) {
        queryParams.filters = {
            $or: [
                { name: { $containsi: search } },
                { slug: { $containsi: search } },
            ],
        };
    }
    
    const queryString = qs(queryParams);
    return fetchStrapi<any>(`/api/authors${queryString}`);
}

/**
 * Gets a single author by their documentId.
 */
export async function getAuthor(documentId: string) {
    const queryString = qs({ populate: '*' });
    return fetchStrapi<any>(`/api/authors/${documentId}${queryString}`);
}

/**
 * Creates a new author.
 */
export async function createAuthor(payload: AuthorPayload) {
    return fetchStrapi<any>('/api/authors', {
        method: 'POST',
        body: { data: payload },
    });
}

/**
 * Updates an author by their documentId.
 */
export async function updateAuthor(documentId: string, payload: Partial<AuthorPayload>) {
    return fetchStrapi<any>(`/api/authors/${documentId}`, {
        method: 'PUT',
        body: { data: payload },
    });
}

/**
 * Deletes an author by their documentId.
 */
export async function deleteAuthor(documentId: string) {
    return fetchStrapi<any>(`/api/authors/${documentId}`, {
        method: 'DELETE',
    });
}
