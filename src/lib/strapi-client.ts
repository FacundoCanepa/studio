'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiResponse, StrapiTag, StrapiEntity } from '@/lib/strapi-types';
import { mapStrapiArticleToArticleDoc } from './strapi-mappers';

const STRAPI_BASE_URL = "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchStrapi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint}`;
  const model = endpoint.split('/api/')[1]?.split('?')[0]?.split('/')[0] || 'unknown';

  try {
    if (!STRAPI_TOKEN) {
      console.warn("[STRAPI] No API token. Proceeding as PUBLIC request.");
    }
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(init?.headers as Record<string,string>),
      ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    };
    console.log('[STRAPI][REQUEST][BUILD]', { model, endpoint, url, hasAuth: Boolean(STRAPI_TOKEN) });

    if (model === 'articles') {
        console.log("[ARTICLES][FETCH][URL]", url);
        console.log("[ARTICLES][FETCH][HAS_AUTH]", Boolean(STRAPI_TOKEN));
    }

    const response = await fetch(url, { 
      ...init,
      method: init?.method ?? 'GET',
      headers, 
      cache: 'no-store',
      next: { revalidate: 0 } 
    }); 
    
    if (model === 'articles') {
        console.log("[ARTICLES][FETCH][RESPONSE_STATUS]", response.status);
        try {
            console.log("[ARTICLES][FETCH][RAW_BODY]", await response.clone().text());
        } catch (e) {
            console.error('[ARTICLES][FETCH][RAW_BODY_ERROR]', e);
        }
    }
    
    console.log('[STRAPI][RESPONSE]', { model, status: response?.status, ok: response?.ok, contentType: response.headers.get('content-type') });
    console.log('[STRAPI][RESPONSE][RATE_LIMIT?]', { remaining: response?.headers?.get?.('x-ratelimit-remaining'), limit: response?.headers?.get?.('x-ratelimit-limit') });
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[STRAPI][RESPONSE][NOT_OK]`, { url, status: response.status, body: errorBody });
      throw new Error(`Strapi request failed with status ${response.status}`);
    }
    
    const json = await response.json().catch((e:any) => {
      console.error("[STRAPI][JSON][PARSE_ERROR]", { url, message: e?.message });
      throw e;
    });

    const meta = (json as any)?.meta;
    console.log('[STRAPI][JSON][META]', meta?.pagination || null);
    const dataLen = Array.isArray(json?.data) ? json.data.length : (json?.data ? 1 : 0);
    console.log('[STRAPI][JSON][DATA_LEN]', dataLen);
    
    if (Array.isArray(json?.data) && json.data.length > 0) {
      const firstItem = json.data[0];
      if (firstItem) {
        console.log("[STRAPI][JSON][FIRST]", {
          documentId: firstItem.documentId,
          slug: firstItem.slug ?? firstItem.name,
          hasSEO: Boolean(firstItem.Name),
        });
      }
    }

    return json as T;

  } catch (error: any) {
    const errorModel = endpoint.split('/api/')[1]?.split('?')[0] || 'unknown';
    console.error('[STRAPI][ERROR]', { model: errorModel, url, message: error?.message, stack: error?.stack });
    throw error;
  }
}

async function fetchPaginated<T extends StrapiEntity>(endpoint: string): Promise<T[]> {
    let allResults: T[] = [];
    let page = 1;
    let totalPages = 1;
    const model = endpoint.split('/api/')[1]?.split('?')[0] || 'unknown';

    do {
        const fullEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}pagination[page]=${page}&pagination[pageSize]=50`;
        try {
          const response: StrapiResponse<T[]> = await fetchStrapi(fullEndpoint);
          
          if (response.data && Array.isArray(response.data)) {
              allResults = allResults.concat(response.data);
          }

          if (response.meta?.pagination) {
              totalPages = response.meta.pagination.pageCount;
          } else {
             if (response.data && !Array.isArray(response.data)) {
               allResults.push(response.data as any);
             }
            break;
          }

          page++;
        } catch (error) {
          console.error(`[STRAPI][PAGINATION_ERROR] Failed to fetch page ${page} for ${model}`, error);
          break; // Exit loop on error
        }
    } while (page <= totalPages);

    return allResults;
}


export async function getStrapiMediaUrl(relativePath?: string | null): Promise<string | undefined> {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;
    const baseUrl = STRAPI_BASE_URL.replace('/api', '');
    return `${baseUrl}${relativePath}`;
}


async function strapiCategoryToCategoryDoc(item: StrapiCategory): Promise<CategoryDoc> {
    return {
        documentId: item.documentId,
        name: item.name,
        slug: item.slug,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}

async function strapiAuthorToAuthorDoc(item: StrapiAuthor): Promise<AuthorDoc> {
    return {
        documentId: item.documentId,
        name: item.Name,
        avatarUrl: await getStrapiMediaUrl(item.Avatar?.data?.attributes.url),
        bioBlocks: item.Bio,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}

// --- API Methods ---

export async function getArticles({
  page = 1,
  pageSize = 12,
  categorySlug,
}: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
} = {}): Promise<ArticleDoc[]> {
    const params = new URLSearchParams();
    params.set('populate', '*');
    params.set('sort', 'publishedAt:desc');
    params.set('pagination[page]', String(page));
    params.set('pagination[pageSize]', String(pageSize));

    const strapiArticles = await fetchPaginated<StrapiArticle>(`/api/articles?${params.toString()}`);
    console.log("[ARTICLES][RAW_LEN]", strapiArticles.length);

    const mappedArticles = (await Promise.all(strapiArticles.map(mapStrapiArticleToArticleDoc))).filter(Boolean) as ArticleDoc[];
    
    const filtered = categorySlug
      ? mappedArticles.filter(a => a?.category?.slug === categorySlug)
      : mappedArticles;

    if (process.env.DEBUG_STRAPI === "true") {
      console.log("[ARTICLES][BYPASS][FILTER]", {
        categorySlug,
        before: mappedArticles.length,
        after: filtered.length,
      });
    }

    console.log("[ARTICLES][MAPPED_LEN]", filtered.length);
    if (filtered.length > 0) {
        console.log("[ARTICLES][MAPPED_FIRST]", {
            documentId: filtered[0].documentId,
            slug: filtered[0].slug,
            title: filtered[0].title
        });
    } else {
        console.warn("[ARTICLES][MAPPED_EMPTY] after mapping/filter");
    }

    return filtered;
}

export async function getArticle(documentId: string): Promise<ArticleDoc | null> {
    const response = await fetchStrapi<StrapiResponse<StrapiArticle>>(`/api/articles/${documentId}?populate=*`);
    if (!response.data) return null;
    return await mapStrapiArticleToArticleDoc(response.data);
}

export async function getAuthors(): Promise<AuthorDoc[]> {
    const authors = await fetchPaginated<StrapiAuthor>('/api/authors?populate=*');
    return Promise.all(authors.map(strapiAuthorToAuthorDoc));
}

export async function getCategories(): Promise<CategoryDoc[]> {
    const json = await fetchStrapi<StrapiResponse<StrapiCategory[]>>(`/api/categories?populate=*&pagination[page]=1&pagination[pageSize]=100&sort=name:asc`);
    const raw = Array.isArray(json?.data) ? json.data : [];
    const mapped: CategoryDoc[] = raw
      .map((c: any) => c?.documentId && c?.name && c?.slug ? ({
        documentId: c.documentId,
        name: c.name,
        slug: c.slug
      }) : null)
      .filter(Boolean) as CategoryDoc[];

    if (process.env.DEBUG_STRAPI === "true") {
      console.log("[NAV][CATEGORIES][BYPASS]", { count: mapped.length, sample: mapped[0] });
    }
    return mapped;
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
