'use server';

import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiResponse, StrapiTag } from '@/lib/strapi-types';

const STRAPI_BASE_URL = "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_TOKEN) {
  console.warn("STRAPI_API_TOKEN is not set. Strapi integration will not work.");
}

async function fetchStrapi<T>(endpoint: string): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint}`;
  
  if (!STRAPI_TOKEN) {
    throw new Error("Strapi API token is not configured.");
  }

  const headers = {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
  };

  try {
    const response = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Strapi request failed with status ${response.status}: ${errorBody}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from Strapi endpoint "${endpoint}":`, error);
    throw error;
  }
}

async function fetchPaginated<T>(endpoint: string): Promise<T[]> {
    let allResults: T[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const fullEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}pagination[page]=${page}&pagination[pageSize]=50`;
        const response: StrapiResponse<T[]> = await fetchStrapi(fullEndpoint);
        
        if (response.data) {
            allResults = allResults.concat(response.data);
        }

        if (response.meta?.pagination) {
            totalPages = response.meta.pagination.pageCount;
        } else {
            // If there's no pagination info, we assume it's a single-page result.
            break;
        }

        page++;
    } while (page <= totalPages);

    return allResults;
}


export function getStrapiMediaUrl(relativePath?: string | null): string | undefined {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;
    // Strapi Cloud returns absolute URLs, but we keep this for local/other setups.
    const baseUrl = STRAPI_BASE_URL.replace('/api', '');
    return `${baseUrl}${relativePath}`;
}

// --- API Methods ---

export const getArticles = () => fetchPaginated<StrapiArticle>('/api/articles?populate=*&sort=publishedAt:desc');
export const getArticle = (documentId: string) => fetchStrapi<StrapiResponse<StrapiArticle>>(`/api/articles/${documentId}?populate=*`);
export const getAuthors = () => fetchPaginated<StrapiAuthor>('/api/authors?populate=*');
export const getCategories = () => fetchPaginated<StrapiCategory>('/api/categories?populate=*');
export const getTags = () => fetchPaginated<StrapiTag>('/api/tags?populate=*');
