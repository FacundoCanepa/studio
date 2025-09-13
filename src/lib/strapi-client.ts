'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiTag, StrapiEntity, StrapiResponse } from '@/lib/strapi-types';
import { mapStrapiArticleToArticleDoc } from './strapi-mappers';

const STRAPI_BASE_URL = "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchStrapi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint}`;
  
  try {
    if (!STRAPI_TOKEN) {
      console.warn("[STRAPI] No API token. Proceeding as PUBLIC request.");
    }
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(init?.headers as Record<string,string>),
      ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    };

    const response = await fetch(url, { 
      ...init,
      method: init?.method ?? 'GET',
      headers, 
      cache: 'no-store', // Revalidate on every request
    }); 
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[STRAPI][RESPONSE][NOT_OK]`, { url, status: response.status, body: errorBody });
      throw new Error(`Strapi request failed with status ${response.status}`);
    }
    
    const json = await response.json().catch((e:any) => {
      console.error("[STRAPI][JSON][PARSE_ERROR]", { url, message: e?.message });
      throw e;
    });

    return json as T;

  } catch (error: any) {
    const errorModel = endpoint.split('/api/')[1]?.split('?')[0] || 'unknown';
    console.error('[STRAPI][ERROR]', { model: errorModel, url, message: error?.message });
    throw error;
  }
}

async function fetchPaginated<T extends StrapiEntity>(endpoint: string): Promise<T[]> {
    let allResults: T[] = [];
    let page = 1;
    let totalPages = 1;
    
    const url = new URL(`${STRAPI_BASE_URL}${endpoint}`);
    
    // Only add pagination params if they are not already present from the calling function
    const usesPagination = url.searchParams.has('pagination[page]') || url.searchParams.has('pagination[pageSize]') || url.searchParams.has('pagination[limit]');
    if (!usesPagination) {
      url.searchParams.set('pagination[pageSize]', '100');
    }

    do {
        if (!usesPagination) {
            url.searchParams.set('pagination[page]', String(page));
        }

        try {
          const response: StrapiResponse<T[]> = await fetchStrapi(url.pathname + url.search);
          
          if (response.data && Array.isArray(response.data)) {
              allResults = allResults.concat(response.data);
          }

          if (response.meta?.pagination && !usesPagination) {
              totalPages = response.meta.pagination.pageCount;
          } else {
             // If there's no pagination in the response, or if the original call used limit, it's a single page result.
             if (response.data && !Array.isArray(response.data)) {
               allResults.push(response.data as any);
             }
            break;
          }

          page++;
        } catch (error) {
          console.error(`[STRAPI][PAGINATION_ERROR] Failed to fetch page ${page} for ${url.pathname}`, error);
          break; // Exit loop on error
        }
    } while (!usesPagination && page <= totalPages);

    return allResults;
}


export async function getStrapiMediaUrl(relativePath?: string | null): Promise<string | undefined> {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;
    return `${STRAPI_BASE_URL.replace('/api', '')}${relativePath}`;
}

// --- API Methods ---

type GetArticlesParams = {
  categorySlug?: string;
  limit?: number;
  filters?: {
    featured?: boolean;
    home?: boolean;
    isNew?: boolean;
  };
};

export async function getArticles({
  categorySlug,
  limit,
  filters = {},
}: GetArticlesParams = {}): Promise<ArticleDoc[]> {
    const params = new URLSearchParams();
    params.set('populate', '*');
    params.set('sort', 'publishedAt:desc');

    if (limit) {
      params.set('pagination[limit]', String(limit));
    }
    
    if (categorySlug) {
      params.set('filters[category][slug][$eq]', categorySlug);
    }
    if (filters.featured !== undefined) {
      params.set('filters[featured][$eq]', String(filters.featured));
    }
    if (filters.home !== undefined) {
      params.set('filters[home][$eq]', String(filters.home));
    }
    if (filters.isNew !== undefined) {
      params.set('filters[New][$eq]', String(filters.isNew));
    }
    
    const strapiArticles = await fetchPaginated<StrapiArticle>(`/api/articles?${params.toString()}`);

    const mappedArticles = (await Promise.all(strapiArticles.map(mapStrapiArticleToArticleDoc))).filter(Boolean) as ArticleDoc[];
    
    return mappedArticles;
}

export async function getArticle(documentId: string): Promise<ArticleDoc | null> {
    const response = await fetchStrapi<StrapiResponse<StrapiArticle>>(`/api/articles/${documentId}?populate=*`);
    if (!response.data) return null;
    return await mapStrapiArticleToArticleDoc(response.data);
}

export async function getAuthors(): Promise<AuthorDoc[]> {
    const authors = await fetchPaginated<StrapiAuthor>('/api/authors?populate=*');
    return Promise.all(authors.map(async (item): Promise<AuthorDoc> => ({
        documentId: item.documentId,
        name: item.Name,
        avatarUrl: await getStrapiMediaUrl(item.Avatar?.url),
        bioBlocks: item.Bio,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    })));
}

export async function getCategories(): Promise<CategoryDoc[]> {
    const json = await fetchStrapi<StrapiResponse<StrapiCategory[]>>(`/api/categories?populate=*&pagination[page]=1&pagination[pageSize]=100&sort=name:asc`);
    const raw = Array.isArray(json?.data) ? json.data : [];
    const mapped: CategoryDoc[] = raw
      .map((c: any) => {
        if (!c || !c.id || !c.attributes?.name || !c.attributes?.slug) {
          return null;
        }
        return {
          documentId: String(c.id),
          name: c.attributes.name,
          slug: c.attributes.slug,
          description: c.attributes.description,
        };
      })
      .filter(Boolean) as CategoryDoc[];

    return mapped;
}

export async function getCategory(slug: string): Promise<CategoryDoc | null> {
    const response = await fetchStrapi<StrapiResponse<StrapiCategory[]>>(`/api/categories?filters[slug][$eq]=${slug}&populate=*`);
    if (!response.data || response.data.length === 0) return null;
    const categoryData = response.data[0];
    return {
        documentId: categoryData.documentId,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color
    };
}


export async function getTags(): Promise<CategoryDoc[]> {
    const tags = await fetchPaginated<StrapiTag>('/api/tags?populate=*');
    return tags.map(tag => ({
        documentId: tag.documentId,
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
    }));
}
