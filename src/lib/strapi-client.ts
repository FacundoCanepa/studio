

'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc, TagDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiTag, StrapiResponse, StrapiGalleryItem, StrapiUser } from '@/lib/strapi-types';
import { mapStrapiArticleToArticleDoc } from './strapi-mappers';

const STRAPI_BASE_URL = process.env.STRAPI_URL || "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchStrapi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  if (!STRAPI_TOKEN) {
    throw new Error('STRAPI_API_TOKEN must be configured in environment variables.');
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
      ...(init?.headers as Record<string,string>),
    };
    
    if (init?.body) {
        headers['Content-Type'] = 'application/json';
    }
    
    console.log(`[FETCH_STRAPI] Requesting URL: ${url}`, { cache: init?.cache, method: init?.method });

    const response = await fetch(url, { 
      ...init,
      headers, 
    }); 
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[FETCH_STRAPI][ERROR_RESPONSE]`, { url, status: response.status, body: errorBody });
      throw new Error(`Strapi request failed with status ${response.status}: ${errorBody}`);
    }
    
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json().catch((e:any) => {
      console.error("[FETCH_STRAPI][JSON_PARSE_ERROR]", { url, message: e?.message });
      throw e;
    });

    console.log(`[FETCH_STRAPI][SUCCESS] Received data from ${url}.`);
    return json as T;

  } catch (error: any) {
    const errorModel = endpoint.split('/api/')[1]?.split('?')[0] || 'unknown';
    console.error('[FETCH_STRAPI][EXCEPTION]', { model: errorModel, url, message: error?.message });
    throw error;
  }
}

export async function performStrapiRequest(endpoint: string, options: RequestInit): Promise<any> {
  const url = new URL(`${STRAPI_BASE_URL}${endpoint}`);
  const params = new URLSearchParams(url.search);
  const isPaginated = params.get('pagination[limit]') === '-1';

  console.log(`[PERFORM_STRAPI_REQUEST] Endpoint: ${endpoint}`, { isPaginated, method: options.method });
  
  if (options.method === 'GET' && isPaginated) {
    params.delete('pagination[limit]');
    params.set('pagination[pageSize]', '100');
    
    let allResults: any[] = [];
    let page = 1;
    let totalPages = 1;

    console.log(`[PERFORM_STRAPI_REQUEST] Starting paginated fetch for ${url.pathname}`);
    do {
      params.set('pagination[page]', String(page));
      const currentUrl = `${url.pathname}?${params.toString()}`;
      try {
        const response = await fetchStrapi<StrapiResponse<any[]>>(currentUrl, { ...options, body: undefined });
        if (response.data && Array.isArray(response.data)) {
          allResults = allResults.concat(response.data);
        }
        if (response.meta?.pagination) {
          totalPages = response.meta.pagination.pageCount;
        } else {
          break;
        }
        page++;
      } catch (error) {
        console.error(`[PERFORM_STRAPI_REQUEST][ERROR] Failed to fetch page ${page} for ${url.pathname}`, error);
        break;
      }
    } while (page <= totalPages);
    
    console.log(`[PERFORM_STRAPI_REQUEST] Finished paginated fetch. Total items: ${allResults.length}`);
    return { data: allResults };
  }
  
  return fetchStrapi<any>(`${url.pathname}?${params.toString()}`, options);
}


export async function getStrapiMediaUrl(relativePath?: string | null): Promise<string | undefined> {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;
    return `${STRAPI_BASE_URL.replace('/api', '')}${relativePath}`;
}

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
  cache?: RequestCache;
};

export async function getArticles({
  categorySlug,
  tagSlug,
  limit,
  filters = {},
  cache,
}: GetArticlesParams = {}): Promise<ArticleDoc[]> {
    console.log('[GET_ARTICLES] Fetching articles with params:', { categorySlug, tagSlug, limit, filters });
    const params = new URLSearchParams();
    params.set('populate', '*');
    params.set('sort', 'publishedAt:desc');
    
    if (limit === -1) {
        params.set('publicationState', 'preview');
        params.set('pagination[limit]', '-1');
    }

    if (limit && limit !== -1) {
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
    
    const response = await performStrapiRequest(`/api/articles?${params.toString()}`, { method: 'GET', cache: cache ?? 'default' });
    const strapiArticles: StrapiArticle[] = response.data || [];
    console.log(`[GET_ARTICLES] Fetched ${strapiArticles.length} raw articles from Strapi.`);

    const mappedArticles = (await Promise.all(strapiArticles.map(mapStrapiArticleToArticleDoc))).filter(Boolean) as ArticleDoc[];
    console.log(`[GET_ARTICLES] Mapped ${mappedArticles.length} articles to ArticleDoc.`);
    
    return mappedArticles;
}

export async function getArticleBySlug(slug: string): Promise<ArticleDoc | null> {
    console.log(`[GET_ARTICLE_BY_SLUG] Fetching article with slug: ${slug}`);
    const params = new URLSearchParams();
    params.set('filters[slug][$eq]', slug);
    params.set('populate', '*');
    params.set('pagination[limit]', '1');
    params.set('publicationState', 'preview');

    const response = await performStrapiRequest(`/api/articles?${params.toString()}`, { method: 'GET', cache: 'no-store' });
    const articleData = response.data?.[0];
    
    if (!articleData) {
        console.warn(`[GET_ARTICLE_BY_SLUG] No article found for slug: ${slug}`);
        return null;
    }
    
    console.log(`[GET_ARTICLE_BY_SLUG] Found article, mapping...`);
    return await mapStrapiArticleToArticleDoc(articleData);
}

export async function getArticleByDocumentId(documentId: string): Promise<ArticleDoc | null> {
    console.log(`[GET_ARTICLE_BY_DOCUMENT_ID] Fetching article with documentId: ${documentId}`);
    const params = new URLSearchParams();
    params.set('filters[documentId][$eq]', documentId);
    params.set('populate', '*');
    params.set('publicationState', 'preview');

    const endpoint = `/api/articles?${params.toString()}`;
    
    try {
        const response = await performStrapiRequest(endpoint, { method: 'GET', cache: 'no-store' });
        const articleData = response.data?.[0];
        
        if (!articleData) {
            console.warn(`[GET_ARTICLE_BY_DOCUMENT_ID] No article found for documentId: ${documentId}`);
            return null;
        }

        console.log(`[GET_ARTICLE_BY_DOCUMENT_ID] Found article, mapping...`);
        return await mapStrapiArticleToArticleDoc(articleData);

    } catch (error: any) {
         if (error.message.includes('404')) {
             console.warn(`[GET_ARTICLE_BY_DOCUMENT_ID] Article with documentId ${documentId} not found.`);
             return null;
         }
         console.error(`[GET_ARTICLE_BY_DOCUMENT_ID] Error fetching article with documentId ${documentId}:`, error);
         throw error;
    }
}


export async function getAuthors(options: { cache?: RequestCache } = {}): Promise<AuthorDoc[]> {
    console.log('[GET_AUTHORS] Fetching all authors...');
    const response = await performStrapiRequest('/api/authors?populate=*&pagination[limit]=-1', { method: 'GET', cache: options.cache ?? 'default' });
    const authors: StrapiAuthor[] = response.data || [];
    console.log(`[GET_AUTHORS] Fetched ${authors.length} authors.`);
    
    const authorDocs = await Promise.all(authors.map(async (authorData) => {
        if (!authorData || !authorData.documentId || !authorData.Name) {
            console.warn('[GET_AUTHORS] Skipping author with missing id, documentId or Name:', authorData);
            return null;
        }

        return {
            id: authorData.id,
            documentId: authorData.documentId,
            name: authorData.Name,
            avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.url),
            bioBlocks: authorData.Bio,
            createdAt: authorData.createdAt,
            updatedAt: authorData.updatedAt,
        };
    }));

    return authorDocs.filter(Boolean) as AuthorDoc[];
}

export async function getAuthor(documentId: string): Promise<AuthorDoc | null> {
    console.log(`[GET_AUTHOR] Fetching author with documentId: ${documentId}`);
    try {
        const params = new URLSearchParams();
        params.set('filters[documentId][$eq]', documentId);
        params.set('populate', '*');
        const response = await performStrapiRequest(`/api/authors?${params.toString()}`, { method: 'GET', cache: 'no-store' });
        const authorData = response.data?.[0];

        if (!authorData) {
            console.warn(`[GET_AUTHOR] No author found for documentId: ${documentId}`);
            return null;
        }
        console.log(`[GET_AUTHOR] Found author: ${authorData.Name}`);
        return {
            id: authorData.id,
            documentId: authorData.documentId,
            name: authorData.Name,
            avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.url),
            bioBlocks: authorData.Bio,
            createdAt: authorData.createdAt,
            updatedAt: authorData.updatedAt,
        };
    } catch (error) {
        console.error(`[GET_AUTHOR][ERROR] Failed to fetch author with documentId ${documentId}`, error);
        return null;
    }
}

export async function getCategories(init?: RequestInit): Promise<CategoryDoc[]> {
  console.log('[GET_CATEGORIES] Fetching all categories...');
  const response = await performStrapiRequest(`/api/categories?populate=*&pagination[limit]=-1&sort=name:asc`, { method: 'GET', ...init });
  const raw: StrapiCategory[] = response.data || [];
  console.log(`[GET_CATEGORIES] Fetched ${raw.length} raw categories.`);

  const mapped: Promise<CategoryDoc | null>[] = raw.map(async (c: StrapiCategory) => {
    if (!c || !c.id || !c.name || !c.slug || !c.documentId) {
       console.warn('[GET_CATEGORIES] Skipping category with missing id, name, slug, or documentId:', c);
      return null;
    }
    return {
      id: c.id,
      documentId: c.documentId,
      name: c.name,
      slug: c.slug,
      description: c.description,
      color: c.color,
      imageUrl: await getStrapiMediaUrl(c.img?.url),
    };
  });

  const results = (await Promise.all(mapped)).filter(Boolean) as CategoryDoc[];
  console.log(`[GET_CATEGORIES] Mapped ${results.length} categories.`);
  return results;
}

export async function getCategory(slug: string): Promise<CategoryDoc | null> {
    console.log(`[GET_CATEGORY] Fetching category with slug: ${slug}`);
    const response = await performStrapiRequest(`/api/categories?filters[slug][$eq]=${slug}&populate=*`, { method: 'GET', cache: 'no-store' });
    const categoryData = response.data?.[0];

    if (!categoryData) {
        console.warn(`[GET_CATEGORY] No category found for slug: ${slug}`);
        return null;
    }
    
    console.log(`[GET_CATEGORY] Found category: ${categoryData.name}`);
    return {
        id: categoryData.id,
        documentId: categoryData.documentId,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
        imageUrl: await getStrapiMediaUrl(categoryData.img?.url),
    };
}


export async function getTags(): Promise<TagDoc[]> {
    console.log('[GET_TAGS] Fetching all tags...');
    const response = await performStrapiRequest('/api/tags?populate=*&pagination[limit]=-1', { method: 'GET', cache: 'no-store' });
    const tags: StrapiTag[] = response.data || [];
    console.log(`[GET_TAGS] Fetched ${tags.length} tags.`);
    const mappedTags = tags.map(tag => {
        if (!tag || !tag.id || !tag.name || !tag.slug || !tag.documentId) return null;
        return {
            id: tag.id,
            documentId: tag.documentId,
            name: tag.name,
            slug: tag.slug,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
        }
    });
    return mappedTags.filter(Boolean) as TagDoc[];
}

export async function getTag(slug: string): Promise<TagDoc | null> {
    console.log(`[GET_TAG] Fetching tag with slug: ${slug}`);
    const response = await performStrapiRequest(`/api/tags?filters[slug][$eq]=${slug}`, { method: 'GET', cache: 'no-store' });
    const tagData = response.data?.[0];
    if (!tagData) {
        console.warn(`[GET_TAG] No tag found for slug: ${slug}`);
        return null;
    }
    console.log(`[GET_TAG] Found tag: ${tagData.name}`);
    return {
        id: tagData.id,
        documentId: tagData.documentId,
        name: tagData.name,
        slug: tagData.slug,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
    };
}

export async function getGalleryItems(): Promise<{ id: string; title: string; description: string; imageUrl: string }[]> {
  console.log('[GET_GALLERY_ITEMS] Fetching gallery items...');
  const response = await performStrapiRequest('/api/Galerias?populate=*&pagination[limit]=-1', { method: 'GET', cache: 'no-store' });
  const galleryItems: StrapiGalleryItem[] = response.data || [];
  console.log(`[GET_GALLERY_ITEMS] Fetched ${galleryItems.length} gallery items.`);

  const items = await Promise.all(galleryItems.map(async (itemData) => {
    if (!itemData || !itemData.documentId) {
      console.warn('[GET_GALLERY_ITEMS] Skipping invalid item from Strapi:', itemData);
      return null;
    }
    const imageUrl = await getStrapiMediaUrl(itemData.Imagen?.url);
    if (!imageUrl) return null;
    return {
      id: itemData.documentId,
      title: itemData.Famoso,
      description: itemData.Nota,
      imageUrl: imageUrl,
    };
  }));
  return items.filter(Boolean) as { id: string; title: string; description: string; imageUrl: string }[];
}


export async function getFavoriteArticles(userId: number, jwt: string): Promise<ArticleDoc[]> {
    console.log(`[GET_FAVORITE_ARTICLES] Fetching for user ID: ${userId}`);
    const user = await fetchStrapi<StrapiUser>(`/api/users/${userId}?populate[favorite_articles][populate]=*`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: 'no-store'
    });
    if (!user || !user.favorite_articles) {
        console.log(`[GET_FAVORITE_ARTICLES] User ${userId} has no favorite articles.`);
        return [];
    }
    
    console.log(`[GET_FAVORITE_ARTICLES] Found ${user.favorite_articles.length} favorite articles for user ${userId}. Mapping...`);
    const mapped = await Promise.all(user.favorite_articles.map(mapStrapiArticleToArticleDoc));
    return mapped.filter(Boolean) as ArticleDoc[];
}

export async function getFavoriteTags(userId: number, jwt: string): Promise<TagDoc[]> {
    console.log(`[GET_FAVORITE_TAGS] Fetching for user ID: ${userId}`);
    const user = await fetchStrapi<StrapiUser>(`/api/users/${userId}?populate[favorite_tags]=*`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: 'no-store'
    });
    if (!user || !user.favorite_tags) {
        console.log(`[GET_FAVORITE_TAGS] User ${userId} has no favorite tags.`);
        return [];
    }
    
    console.log(`[GET_FAVORITE_TAGS] Found ${user.favorite_tags.length} favorite tags for user ${userId}.`);
    return user.favorite_tags.map(tag => ({
        id: tag.id,
        documentId: tag.documentId,
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
    }));
}
