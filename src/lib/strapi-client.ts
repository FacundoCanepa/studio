'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiResponse, StrapiTag, StrapiEntity } from '@/lib/strapi-types';

const STRAPI_BASE_URL = "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_TOKEN) {
  console.warn("[STRAPI] No API token. Proceeding as PUBLIC request.");
}

async function fetchStrapi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint}`;
  const model = endpoint.split('/')[2].split('?')[0];
  
  console.log('[STRAPI][REQUEST][BUILD]', { model, endpoint, url });
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(init?.headers as Record<string,string>),
    ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
  };
  console.log('[STRAPI][REQUEST][HEADERS]', { hasAuth: Boolean(STRAPI_TOKEN), accept: headers.Accept });


  try {
    const response = await fetch(url, { 
      ...init,
      method: init?.method ?? 'GET',
      headers, 
      cache: 'no-store',
      next: { revalidate: 0 } 
    }); 
    console.log('[STRAPI][RESPONSE]', { model, status: response?.status, ok: response?.ok });
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
    console.log('[STRAPI][JSON][DATA_TYPE]', Array.isArray(json?.data) ? 'array' : typeof json?.data);
    const dataLen = Array.isArray(json?.data) ? json.data.length : (json?.data ? 1 : 0);
    console.log('[STRAPI][JSON][DATA_LEN]', dataLen);
    
    if (Array.isArray(json?.data) && json.data[0]) {
      const firstItem = json.data[0]?.attributes;
      console.log("[STRAPI][JSON][FIRST]", {
        documentId: firstItem.documentId,
        slug: firstItem.slug ?? firstItem.name,
        hasSEO: Boolean(firstItem.Name),
      });
    }

    return json as T;

  } catch (error: any) {
    console.error('[STRAPI][ERROR]', { model, url, message: error?.message, stack: error?.stack });
    throw error;
  }
}

async function fetchPaginated<T extends StrapiEntity>(endpoint: string): Promise<T[]> {
    let allResults: T[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const fullEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '&'}pagination[page]=${page}&pagination[pageSize]=50`;
        try {
          const response: StrapiResponse<T[]> = await fetchStrapi(fullEndpoint);
          
          if (response.data) {
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
          console.error(`[STRAPI][PAGINATION_ERROR] Failed to fetch page ${page} for ${endpoint}`, error);
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

// --- Mappers ---

async function strapiArticleToArticleDoc(item: StrapiArticle): Promise<ArticleDoc> {
    const docId = item.attributes.documentId;
    const coverUrl = await getStrapiMediaUrl(item.attributes.cover?.data?.attributes.url);
    const categorySlug = item.attributes.category?.data?.attributes.slug;
    const tagSlugs = item.attributes.tags.data.map(t => t.attributes.slug);
    const authorName = item.attributes.author?.data?.attributes.Name;
    const publishedAt = item.attributes.publishedAt;
    
    // SEO component is named "Name"
    const seoComponent = item.attributes.Name;
    console.log('[MAP][ARTICLE][IN]', { documentId: item.attributes.documentId, title: item.attributes.title, slug: item.attributes.slug, hasCover: Boolean(item.attributes.cover?.data?.attributes.url), hasSEO: Boolean(seoComponent), tagCount: item.attributes.tags.data.length || 0, categorySlug: categorySlug, authorName: authorName });

    const seo = seoComponent ? {
        metaTitle: seoComponent.metaTitle,
        metaDescription: seoComponent.metaDescription,
        ogImageUrl: await getStrapiMediaUrl(seoComponent.ogImage?.data?.attributes.url),
        canonicalUrl: seoComponent.canonicalUrl,
    } : undefined;
    console.log('[MAP][ARTICLE][SEO]', seoComponent ? { hasSeo: true, metaTitle: seoComponent.metaTitle, hasOg: Boolean(seoComponent.ogImage) } : { hasSeo: false });

    const articleDoc: ArticleDoc = {
        documentId: docId,
        title: item.attributes.title,
        slug: item.attributes.slug,
        excerpt: item.attributes.excerpt,
        contentHtml: item.attributes.Content,
        coverUrl: coverUrl,
        featured: item.attributes.featured ?? false,
        publishedAt: publishedAt,
        createdAt: item.attributes.createdAt,
        updatedAt: item.attributes.updatedAt,
        category: item.attributes.category?.data ? {
            documentId: item.attributes.category.data.attributes.documentId,
            name: item.attributes.category.data.attributes.name,
            slug: item.attributes.category.data.attributes.slug,
        } : null,
        author: item.attributes.author?.data ? {
            documentId: item.attributes.author.data.attributes.documentId,
            name: item.attributes.author.data.attributes.Name,
            avatarUrl: await getStrapiMediaUrl(item.attributes.author.data.attributes.Avatar?.data?.attributes.url)
        } : null,
        tags: item.attributes.tags.data.map(t => ({
            documentId: t.attributes.documentId,
            name: t.attributes.name,
            slug: t.attributes.slug,
        })),
        categorySlug: categorySlug,
        tagSlugs: tagSlugs,
        authorName: authorName,
        seo: seo
    };
    
    console.log('[MAP][ARTICLE][OUT]', { id: docId, coverUrl, categorySlug, tagSlugs: tagSlugs.length, authorName, publishedAt });

    return articleDoc;
}

async function strapiCategoryToCategoryDoc(item: StrapiCategory): Promise<CategoryDoc> {
    return {
        documentId: item.attributes.documentId,
        name: item.attributes.name,
        slug: item.attributes.slug,
        createdAt: item.attributes.createdAt,
        updatedAt: item.attributes.updatedAt,
    };
}

async function strapiAuthorToAuthorDoc(item: StrapiAuthor): Promise<AuthorDoc> {
    return {
        documentId: item.attributes.documentId,
        name: item.attributes.Name,
        avatarUrl: await getStrapiMediaUrl(item.attributes.Avatar?.data?.attributes.url),
        bioBlocks: item.attributes.Bio,
        createdAt: item.attributes.createdAt,
        updatedAt: item.attributes.updatedAt,
    };
}

// --- API Methods ---

export async function getArticles(): Promise<ArticleDoc[]> {
    const articles = await fetchPaginated<StrapiArticle>('/api/articles?populate=*&sort=publishedAt:desc');
    return Promise.all(articles.map(strapiArticleToArticleDoc));
}

export async function getArticle(documentId: string): Promise<ArticleDoc | null> {
    const response = await fetchStrapi<StrapiResponse<StrapiArticle>>(`/api/articles/${documentId}?populate=*`);
    return response.data ? strapiArticleToArticleDoc(response.data) : null;
}

export async function getAuthors(): Promise<AuthorDoc[]> {
    const authors = await fetchPaginated<StrapiAuthor>('/api/authors?populate=*');
    return Promise.all(authors.map(strapiAuthorToAuthorDoc));
}

export async function getCategories(): Promise<CategoryDoc[]> {
    const categories = await fetchPaginated<StrapiCategory>('/api/categories?populate=*');
    return Promise.all(categories.map(strapiCategoryToCategoryDoc));
}

export async function getTags(): Promise<CategoryDoc[]> {
    const tags = await fetchPaginated<StrapiTag>('/api/tags?populate=*');
    return tags.map(tag => ({
        documentId: tag.attributes.documentId,
        name: tag.attributes.name,
        slug: tag.attributes.slug,
        createdAt: tag.attributes.createdAt,
        updatedAt: tag.attributes.updatedAt,
    }));
}