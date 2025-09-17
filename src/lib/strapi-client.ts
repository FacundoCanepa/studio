

'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc, TagDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiTag, StrapiResponse, StrapiGalleryItem, StrapiUser } from '@/lib/strapi-types';
import { mapStrapiArticleToArticleDoc } from './strapi-mappers';

const STRAPI_BASE_URL = "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchStrapi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint}`;
  
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(init?.headers as Record<string,string>),
    };
    if (STRAPI_TOKEN) {
        headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
    } else {
        console.warn(`[STRAPI] No API token. Proceeding as PUBLIC request.`);
    }
    
    console.log(`[FETCH_STRAPI] Requesting URL: ${url}`, { cache: init?.cache });

    const response = await fetch(url, { 
      method: init?.method ?? 'GET',
      headers, 
      ...init,
    }); 
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[FETCH_STRAPI][ERROR_RESPONSE]`, { url, status: response.status, body: errorBody });
      throw new Error(`Strapi request failed with status ${response.status}`);
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

async function fetchPaginated<T extends { id: number; attributes: any; }>(endpoint: string, init?: RequestInit): Promise<T[]> {
  const url = new URL(`${STRAPI_BASE_URL}${endpoint}`);
  const params = new URLSearchParams(url.search);
  const fetchAll = params.get('pagination[limit]') === '-1';
  console.log(`[FETCH_PAGINATED] Endpoint: ${endpoint}`, { fetchAll });

  if (fetchAll) {
    params.delete('pagination[limit]');
    params.set('pagination[pageSize]', '100');
    
    let allResults: T[] = [];
    let page = 1;
    let totalPages = 1;
    
    console.log(`[FETCH_PAGINATED] Starting fetchAll loop for ${url.pathname}`);

    do {
      params.set('pagination[page]', String(page));
      const currentUrl = `${url.pathname}?${params.toString()}`;
      console.log(`[FETCH_PAGINATED] Fetching page ${page} of ${totalPages}... URL: ${currentUrl}`);
      
      try {
        const response: StrapiResponse<T[]> = await fetchStrapi(currentUrl, init);
        
        if (response.data && Array.isArray(response.data)) {
          allResults = allResults.concat(response.data);
          console.log(`[FETCH_PAGINATED] Page ${page} fetched ${response.data.length} items. Total items: ${allResults.length}`);
        }

        if (response.meta?.pagination) {
          totalPages = response.meta.pagination.pageCount;
        } else {
           console.log(`[FETCH_PAGINATED] No pagination info in response. Assuming single page. Breaking loop.`);
          break; 
        }
        page++;
      } catch (error) {
        console.error(`[FETCH_PAGINATED][ERROR] Failed to fetch page ${page} for ${url.pathname}`, error);
        break; 
      }
    } while (page <= totalPages);
    
    console.log(`[FETCH_PAGINATED] Finished fetchAll loop. Total items fetched: ${allResults.length}`);
    return allResults.filter(Boolean);
  } else {
    console.log(`[FETCH_PAGINATED] Performing single page fetch for ${endpoint}`);
    const response: StrapiResponse<T[] | T> = await fetchStrapi(`${url.pathname}?${params.toString()}`, init);
    if (Array.isArray(response.data)) {
        return response.data.filter(Boolean);
    }
    if(response.data) {
        return [response.data].filter(Boolean);
    }
    return [];
  }
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
    
    const strapiArticles = await fetchPaginated<StrapiArticle>(`/api/articles?${params.toString()}`, { cache: cache ?? 'default' });
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

    const response = await fetchStrapi<StrapiResponse<StrapiArticle[]>>(`/api/articles?${params.toString()}`, { cache: 'no-store' });
    if (!response.data || response.data.length === 0) {
        console.warn(`[GET_ARTICLE_BY_SLUG] No article found for slug: ${slug}`);
        return null;
    }
    
    console.log(`[GET_ARTICLE_BY_SLUG] Found article, mapping...`);
    return await mapStrapiArticleToArticleDoc(response.data[0]);
}

export async function getArticleByDocumentId(documentId: string): Promise<ArticleDoc | null> {
    console.log(`[GET_ARTICLE_BY_DOCUMENT_ID] Fetching article with documentId: ${documentId}`);
    const params = new URLSearchParams();
    params.set('filters[documentId][$eq]', documentId);
    params.set('populate', '*');
    params.set('publicationState', 'preview');

    const endpoint = `/api/articles?${params.toString()}`;
    
    try {
        const response = await fetchStrapi<StrapiResponse<StrapiArticle[]>>(endpoint, { cache: 'no-store' });
        
        if (!response.data || response.data.length === 0) {
            console.warn(`[GET_ARTICLE_BY_DOCUMENT_ID] No article found for documentId: ${documentId}`);
            return null;
        }
        
        if (response.data.length > 1) {
            console.warn(`[GET_ARTICLE_BY_DOCUMENT_ID] Found multiple articles for documentId: ${documentId}. Returning the first one.`);
        }

        console.log(`[GET_ARTICLE_BY_DOCUMENT_ID] Found article, mapping...`);
        return await mapStrapiArticleToArticleDoc(response.data[0]);

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
    const authors = await fetchPaginated<StrapiAuthor>('/api/authors?populate=*&pagination[limit]=-1', { cache: options.cache ?? 'default' });
    console.log(`[GET_AUTHORS] Fetched ${authors.length} authors.`);
    
    const authorDocs = await Promise.all(authors.map(async (item) => {
        if (!item || !item.attributes) {
            console.warn('[GET_AUTHORS] Skipping invalid author item from Strapi:', item);
            return null;
        }

        const authorData = item.attributes;
        if (!item.id || !authorData.documentId || !authorData.Name) {
            console.warn('[GET_AUTHORS] Skipping author with missing id, documentId or Name:', item);
            return null;
        }

        return {
            id: item.id,
            documentId: authorData.documentId,
            name: authorData.Name,
            avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.data?.attributes.url),
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
        const response = await fetchStrapi<StrapiResponse<StrapiAuthor[]>>(`/api/authors?${params.toString()}`, { cache: 'no-store' });

        if (!response.data || response.data.length === 0) {
            console.warn(`[GET_AUTHOR] No author found for documentId: ${documentId}`);
            return null;
        }
        const authorData = response.data[0].attributes;
        const authorId = response.data[0].id;
        console.log(`[GET_AUTHOR] Found author: ${authorData.Name}`);
        return {
            id: authorId,
            documentId: authorData.documentId,
            name: authorData.Name,
            avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.data?.attributes.url),
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
  const raw = await fetchPaginated<StrapiCategory>(`/api/categories?populate=*&pagination[limit]=-1&sort=name:asc`, init);
  console.log(`[GET_CATEGORIES] Fetched ${raw.length} raw categories.`);

  const mapped: Promise<CategoryDoc | null>[] = raw.map(async (item: StrapiCategory) => {
    if (!item?.attributes) {
      console.warn('[GET_CATEGORIES] Skipping invalid item from Strapi:', item);
      return null;
    }
    const c = item.attributes;
    const id = item.id;

    if (!id || !c.name || !c.slug || !c.documentId) {
       console.warn('[GET_CATEGORIES] Skipping category with missing id, name, slug, or documentId:', item);
      return null;
    }
    return {
      id: id,
      documentId: c.documentId,
      name: c.name,
      slug: c.slug,
      description: c.description,
      color: c.color,
      imageUrl: await getStrapiMediaUrl(c.img?.data?.attributes.url),
    };
  });

  const results = (await Promise.all(mapped)).filter(Boolean) as CategoryDoc[];
  console.log(`[GET_CATEGORIES] Mapped ${results.length} categories.`);
  return results;
}

export async function getCategory(slug: string): Promise<CategoryDoc | null> {
    console.log(`[GET_CATEGORY] Fetching category with slug: ${slug}`);
    const response = await fetchStrapi<StrapiResponse<StrapiCategory[]>>(`/api/categories?filters[slug][$eq]=${slug}&populate=*`, { cache: 'no-store' });
    if (!response.data || response.data.length === 0) {
        console.warn(`[GET_CATEGORY] No category found for slug: ${slug}`);
        return null;
    }
    const categoryData = response.data[0].attributes;
    console.log(`[GET_CATEGORY] Found category: ${categoryData.name}`);
    return {
        id: response.data[0].id,
        documentId: categoryData.documentId,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
        imageUrl: await getStrapiMediaUrl(categoryData.img?.data?.attributes.url),
    };
}


export async function getTags(): Promise<TagDoc[]> {
    console.log('[GET_TAGS] Fetching all tags...');
    const tags = await fetchPaginated<StrapiTag>('/api/tags?populate=*&pagination[limit]=-1', { cache: 'no-store' });
    console.log(`[GET_TAGS] Fetched ${tags.length} tags.`);
    const mappedTags = tags.map(tag => {
        if (!tag || !tag.attributes) return null;
        return {
            id: tag.id,
            documentId: tag.attributes.documentId,
            name: tag.attributes.name,
            slug: tag.attributes.slug,
            createdAt: tag.attributes.createdAt,
            updatedAt: tag.attributes.updatedAt,
        }
    });
    return mappedTags.filter(Boolean) as TagDoc[];
}

export async function getTag(slug: string): Promise<TagDoc | null> {
    console.log(`[GET_TAG] Fetching tag with slug: ${slug}`);
    const response = await fetchStrapi<StrapiResponse<StrapiTag[]>>(`/api/tags?filters[slug][$eq]=${slug}`, { cache: 'no-store' });
    if (!response.data || response.data.length === 0) {
        console.warn(`[GET_TAG] No tag found for slug: ${slug}`);
        return null;
    }
    const tagData = response.data[0].attributes;
    console.log(`[GET_TAG] Found tag: ${tagData.name}`);
    return {
        id: response.data[0].id,
        documentId: tagData.documentId,
        name: tagData.name,
        slug: tagData.slug,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
    };
}

export async function getGalleryItems(): Promise<{ id: string; title: string; description: string; imageUrl: string }[]> {
  console.log('[GET_GALLERY_ITEMS] Fetching gallery items...');
  const response = await fetchPaginated<StrapiGalleryItem>('/api/Galerias?populate=*&pagination[limit]=-1', { cache: 'no-store' });
  console.log(`[GET_GALLERY_ITEMS] Fetched ${response.length} gallery items.`);

  const items = await Promise.all(response.map(async (item) => {
    if (!item || !item.attributes) {
      console.warn('[GET_GALLERY_ITEMS] Skipping invalid item from Strapi:', item);
      return null;
    }
    const itemData = item.attributes;
    const imageUrl = await getStrapiMediaUrl(itemData.Imagen?.data?.attributes.url);
    if (!imageUrl) return null;
    return {
      id: itemData.documentId || String(item.id),
      title: itemData.Famoso,
      description: itemData.Nota,
      imageUrl: imageUrl,
    };
  }));
  return items.filter(Boolean) as { id: string; title: string; description: string; imageUrl: string }[];
}


export async function getFavoriteArticles(userId: number, jwt: string): Promise<ArticleDoc[]> {
    console.log(`[GET_FAVORITE_ARTICLES] Fetching for user ID: ${userId}`);
    const response = await fetchStrapi<StrapiUser>(`/api/users/${userId}?populate[favorite_articles][populate]=*`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: 'no-store'
    });
    if (!response || !response.favorite_articles) {
        console.log(`[GET_FAVORITE_ARTICLES] User ${userId} has no favorite articles.`);
        return [];
    }
    
    console.log(`[GET_FAVORITE_ARTICLES] Found ${response.favorite_articles.length} favorite articles for user ${userId}. Mapping...`);
    const mapped = await Promise.all(response.favorite_articles.map(mapStrapiArticleToArticleDoc));
    return mapped.filter(Boolean) as ArticleDoc[];
}

export async function getFavoriteTags(userId: number, jwt: string): Promise<TagDoc[]> {
    console.log(`[GET_FAVORITE_TAGS] Fetching for user ID: ${userId}`);
    const response = await fetchStrapi<StrapiUser>(`/api/users/${userId}?populate[favorite_tags]=*`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: 'no-store'
    });
    if (!response || !response.favorite_tags) {
        console.log(`[GET_FAVORITE_TAGS] User ${userId} has no favorite tags.`);
        return [];
    }
    
    console.log(`[GET_FAVORITE_TAGS] Found ${response.favorite_tags.length} favorite tags for user ${userId}.`);
    return response.favorite_tags.map(tag => ({
        id: tag.id,
        documentId: tag.documentId,
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
    }));
}
