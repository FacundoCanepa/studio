
'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc, TagDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiTag, StrapiEntity, StrapiResponse, StrapiGalleryItem, StrapiUser } from '@/lib/strapi-types';
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
  const url = new URL(`${STRAPI_BASE_URL}${endpoint}`);
  const fetchAll = url.searchParams.get('pagination[limit]') === '-1';

  if (fetchAll) {
    url.searchParams.delete('pagination[limit]');
    url.searchParams.set('pagination[pageSize]', '100');
    
    let allResults: T[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      url.searchParams.set('pagination[page]', String(page));
      try {
        const response: StrapiResponse<T[]> = await fetchStrapi(url.pathname + url.search);
        
        if (response.data && Array.isArray(response.data)) {
          allResults = allResults.concat(response.data);
        }

        if (response.meta?.pagination) {
          totalPages = response.meta.pagination.pageCount;
        } else {
          break; // No pagination info, break loop
        }
        page++;
      } catch (error) {
        console.error(`[STRAPI][PAGINATION_ERROR] Failed to fetch page ${page} for ${url.pathname}`, error);
        break; // Exit loop on error
      }
    } while (page <= totalPages);

    return allResults;
  } else {
    // Original behavior for single page / specific limit
    const response: StrapiResponse<T[] | T> = await fetchStrapi(url.pathname + url.search);
    if (Array.isArray(response.data)) {
        return response.data;
    }
    if(response.data) {
        return [response.data];
    }
    return [];
  }
}


export async function getStrapiMediaUrl(relativePath?: string | null): Promise<string | undefined> {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;
    return `${STRAPI_BASE_URL.replace('/api', '')}${relativePath}`;
}

// --- API Methods ---

type GetArticlesParams = {
  categorySlug?: string;
  tagSlug?: string;
  limit?: number;
  filters?: {
    featured?: boolean;
    home?: boolean;
    isNew?: boolean;
    ids?: number[];
  };
};

export async function getArticles({
  categorySlug,
  tagSlug,
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
    if (tagSlug) {
      params.set('filters[tags][slug][$eq]', tagSlug);
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
    if (filters.ids && filters.ids.length > 0) {
        filters.ids.forEach(id => {
            params.append('filters[id][$in]', String(id));
        });
    }
    
    const strapiArticles = await fetchPaginated<StrapiArticle>(`/api/articles?${params.toString()}`);

    const mappedArticles = (await Promise.all(strapiArticles.map(mapStrapiArticleToArticleDoc))).filter(Boolean) as ArticleDoc[];
    
    return mappedArticles;
}

export async function getArticleBySlug(slug: string): Promise<ArticleDoc | null> {
    const params = new URLSearchParams();
    params.set('filters[slug][$eq]', slug);
    params.set('populate', '*');
    params.set('pagination[limit]', '1');

    const response = await fetchStrapi<StrapiResponse<StrapiArticle[]>>(`/api/articles?${params.toString()}`);
    if (!response.data || response.data.length === 0) return null;
    
    return await mapStrapiArticleToArticleDoc(response.data[0]);
}

export async function getArticle(documentId: string): Promise<ArticleDoc | null> {
    const response = await fetchStrapi<StrapiResponse<StrapiArticle>>(`/api/articles/${documentId}?populate=*`);
    if (!response.data) return null;
    return await mapStrapiArticleToArticleDoc(response.data);
}

export async function getAuthors(): Promise<AuthorDoc[]> {
    const authors = await fetchPaginated<StrapiAuthor>('/api/authors?populate=*&pagination[limit]=-1');
    return Promise.all(authors.map(async (item): Promise<AuthorDoc> => ({
        documentId: String(item.id),
        name: item.Name,
        avatarUrl: await getStrapiMediaUrl(item.Avatar?.url),
        bioBlocks: item.Bio,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    })));
}

export async function getAuthor(id: string): Promise<AuthorDoc | null> {
    try {
        const response = await fetchStrapi<StrapiResponse<StrapiAuthor>>(`/api/authors/${id}?populate=*`);
        if (!response.data) return null;
        const authorData = response.data;
        return {
            documentId: String(authorData.id),
            name: authorData.Name,
            avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.url),
            bioBlocks: authorData.Bio,
            createdAt: authorData.createdAt,
            updatedAt: authorData.updatedAt,
        };
    } catch (error) {
        console.error(`[STRAPI][GET_AUTHOR_ERROR] Failed to fetch author with id ${id}`, error);
        return null;
    }
}

export async function getCategories(): Promise<CategoryDoc[]> {
    const raw = await fetchPaginated<StrapiCategory>(`/api/categories?populate=*&pagination[limit]=-1&sort=name:asc`);
    
    const mapped: Promise<CategoryDoc | null>[] = raw
      .map(async (c: StrapiCategory) => {
        if (!c || !c.id || !c.name || !c.slug) {
          return null;
        }
        return {
          documentId: String(c.id),
          name: c.name,
          slug: c.slug,
          description: c.description,
          color: c.color,
          imageUrl: await getStrapiMediaUrl(c.img?.url),
        };
      });

    return (await Promise.all(mapped)).filter(Boolean) as CategoryDoc[];
}

export async function getCategory(slug: string): Promise<CategoryDoc | null> {
    const response = await fetchStrapi<StrapiResponse<StrapiCategory[]>>(`/api/categories?filters[slug][$eq]=${slug}&populate=*`);
    if (!response.data || response.data.length === 0) return null;
    const categoryData = response.data[0];
    return {
        documentId: String(categoryData.id),
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
        imageUrl: await getStrapiMediaUrl(categoryData.img?.url),
    };
}


export async function getTags(): Promise<TagDoc[]> {
    const tags = await fetchPaginated<StrapiTag>('/api/tags?populate=*&pagination[limit]=-1');
    return tags.map(tag => ({
        documentId: String(tag.id),
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
    }));
}

export async function getTag(slug: string): Promise<TagDoc | null> {
    const response = await fetchStrapi<StrapiResponse<StrapiTag[]>>(`/api/tags?filters[slug][$eq]=${slug}`);
    if (!response.data || response.data.length === 0) return null;
    const tagData = response.data[0];
    return {
        documentId: String(tagData.id),
        name: tagData.name,
        slug: tagData.slug,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
    };
}

export async function getGalleryItems(): Promise<{ id: string; title: string; description: string; imageUrl: string }[]> {
  const response = await fetchPaginated<StrapiGalleryItem>('/api/Galerias?populate=*&pagination[limit]=-1');

  const items = await Promise.all(response.map(async (item) => {
    const imageUrl = await getStrapiMediaUrl(item.Imagen?.url);
    if (!imageUrl) return null;
    return {
      id: String(item.id),
      title: item.Famoso,
      description: item.Nota,
      imageUrl: imageUrl,
    };
  }));
  return items.filter(Boolean) as { id: string; title: string; description: string; imageUrl: string }[];
}


export async function getFavoriteArticles(userId: number, jwt: string): Promise<ArticleDoc[]> {
    const response = await fetchStrapi<StrapiUser>(`/api/users/${userId}?populate[favorite_articles][populate]=*`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!response || !response.favorite_articles) return [];
    
    const mapped = await Promise.all(response.favorite_articles.map(mapStrapiArticleToArticleDoc));
    return mapped.filter(Boolean) as ArticleDoc[];
}

export async function getFavoriteTags(userId: number, jwt: string): Promise<TagDoc[]> {
    const response = await fetchStrapi<StrapiUser>(`/api/users/${userId}?populate[favorite_tags]=*`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!response || !response.favorite_tags) return [];
    
    return response.favorite_tags.map(tag => ({
        documentId: String(tag.id),
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
    }));
}
