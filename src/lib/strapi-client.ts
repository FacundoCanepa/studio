

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
    // Do not re-throw if it's a build error, let it be handled by Next.js
    if (!error.message.includes('Dynamic server usage')) {
        throw error;
    }
    // Return empty data for build-time dynamic usage errors to avoid crashes
    return { data: [], meta: {} } as T;
  }
}

async function fetchPaginated<T extends StrapiEntity>(endpoint: string, init?: RequestInit): Promise<T[]> {
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
          break; // No pagination info, break loop
        }
        page++;
      } catch (error) {
        console.error(`[FETCH_PAGINATED][ERROR] Failed to fetch page ${page} for ${url.pathname}`, error);
        break; // Exit loop on error
      }
    } while (page <= totalPages);
    
    console.log(`[FETCH_PAGINATED] Finished fetchAll loop. Total items fetched: ${allResults.length}`);
    return allResults;
  } else {
    // Original behavior for single page / specific limit
    console.log(`[FETCH_PAGINATED] Performing single page fetch for ${endpoint}`);
    const response: StrapiResponse<T[] | T> = await fetchStrapi(`${url.pathname}?${params.toString()}`, init);
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
    
    // For admin panel, we need to see everything, including drafts
    if (limit === -1) {
        params.set('publicationState', 'preview');
    }

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
    params.set('publicationState', 'preview'); // Allow fetching drafts

    const response = await fetchStrapi<StrapiResponse<StrapiArticle[]>>(`/api/articles?${params.toString()}`, { cache: 'no-store' });
    if (!response.data || response.data.length === 0) {
        console.warn(`[GET_ARTICLE_BY_SLUG] No article found for slug: ${slug}`);
        return null;
    }
    
    console.log(`[GET_ARTICLE_BY_SLUG] Found article, mapping...`);
    return await mapStrapiArticleToArticleDoc(response.data[0]);
}

/**
 * Fetches a single article from Strapi using its ID.
 * This acts as our `findOne` implementation.
 * @param documentId - The ID of the article to fetch (can be numeric or the alphanumeric documentId).
 */
export async function getArticle(documentId: string): Promise<ArticleDoc | null> {
    console.log(`[GET_ARTICLE] Fetching article with ID: ${documentId}`);
    
    // 1. Build the query parameters.
    const params = new URLSearchParams();
    
    // 2. Filter by the 'id' field, which corresponds to your documentId in Strapi.
    params.set('filters[id][$eq]', documentId);
    
    // 3. Populate all related fields (author, category, tags, images, etc.).
    params.set('populate', '*');
    
    // 4. Crucial for the admin panel: get the article even if it's a draft.
    params.set('publicationState', 'preview');

    // 5. Perform the fetch using the collection endpoint with our filters.
    // Strapi will return an array, even if there's only one match.
    const response = await fetchStrapi<StrapiResponse<StrapiArticle[]>>(`/api/articles?${params.toString()}`, { cache: 'no-store' });
    
    // 6. Check if any article was found.
    if (!response.data || response.data.length === 0) {
        console.warn(`[GET_ARTICLE] No article found for ID: ${documentId}`);
        return null;
    }
    
    console.log(`[GET_ARTICLE] Found article with ID ${documentId}, mapping...`);
    
    // 7. Return the first (and only) result from the array.
    return await mapStrapiArticleToArticleDoc(response.data[0]);
}

export async function getAuthors(options: { cache?: RequestCache } = {}): Promise<AuthorDoc[]> {
    console.log('[GET_AUTHORS] Fetching all authors...');
    const authors = await fetchPaginated<StrapiAuthor>('/api/authors?populate=*&pagination[limit]=-1', { cache: options.cache ?? 'default' });
    console.log(`[GET_AUTHORS] Fetched ${authors.length} authors.`);
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
    console.log(`[GET_AUTHOR] Fetching author with ID: ${id}`);
    try {
        const response = await fetchStrapi<StrapiResponse<StrapiAuthor>>(`/api/authors/${id}?populate=*`, { cache: 'no-store' });
        if (!response.data) {
            console.warn(`[GET_AUTHOR] No author found for ID: ${id}`);
            return null;
        }
        const authorData = response.data;
        console.log(`[GET_AUTHOR] Found author: ${authorData.Name}`);
        return {
            documentId: String(authorData.id),
            name: authorData.Name,
            avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.url),
            bioBlocks: authorData.Bio,
            createdAt: authorData.createdAt,
            updatedAt: authorData.updatedAt,
        };
    } catch (error) {
        console.error(`[GET_AUTHOR][ERROR] Failed to fetch author with id ${id}`, error);
        return null;
    }
}

export async function getCategories(init?: RequestInit): Promise<CategoryDoc[]> {
    console.log('[GET_CATEGORIES] Fetching all categories...');
    const raw = await fetchPaginated<StrapiCategory>(`/api/categories?populate=*&pagination[limit]=-1&sort=name:asc`, init);
    console.log(`[GET_CATEGORIES] Fetched ${raw.length} raw categories.`);
    
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
    const categoryData = response.data[0];
    console.log(`[GET_CATEGORY] Found category: ${categoryData.name}`);
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
    console.log('[GET_TAGS] Fetching all tags...');
    const tags = await fetchPaginated<StrapiTag>('/api/tags?populate=*&pagination[limit]=-1', { cache: 'no-store' });
    console.log(`[GET_TAGS] Fetched ${tags.length} tags.`);
    return tags.map(tag => ({
        documentId: String(tag.id),
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
    }));
}

export async function getTag(slug: string): Promise<TagDoc | null> {
    console.log(`[GET_TAG] Fetching tag with slug: ${slug}`);
    const response = await fetchStrapi<StrapiResponse<StrapiTag[]>>(`/api/tags?filters[slug][$eq]=${slug}`, { cache: 'no-store' });
    if (!response.data || response.data.length === 0) {
        console.warn(`[GET_TAG] No tag found for slug: ${slug}`);
        return null;
    }
    const tagData = response.data[0];
    console.log(`[GET_TAG] Found tag: ${tagData.name}`);
    return {
        documentId: String(tagData.id),
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
        documentId: String(tag.id),
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
    }));
}
