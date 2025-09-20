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
  Name: string;
  Bio?: string;
  Avatar?: number | null;
};

export type AuthorDoc = {
  id: number;
  documentId: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  articles?: Array<{ id: number; title: string }>;
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
            Name: { $containsi: search },
        };
    }
    
    const queryString = qs(queryParams);
    return fetchStrapi<any>(`/api/authors${queryString}`);
}

/**
 * Gets a single author by their documentId.
 */
export async function getAuthor(documentId: string) {
    const queryString = qs({
        populate: {
            articles: {
                fields: ['title'],
            },
            Avatar: {
                fields: ['url'],
            },
        },
    });
    return fetchStrapi<any>(`/api/authors/${documentId}${queryString}`);
}

/**
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
