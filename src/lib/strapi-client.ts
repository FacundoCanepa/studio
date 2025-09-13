'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiResponse, StrapiTag } from '@/lib/strapi-types';

const STRAPI_BASE_URL = "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_TOKEN) {
  console.warn("STRAPI_API_TOKEN is not set. Strapi integration will not work.");
}

async function fetchStrapi<T>(endpoint: string): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint}`;
  
  if (!STRAPI_TOKEN) {
    console.error("Strapi API token is not configured.");
    // In a real app, you might want a more robust error handling or fallback mechanism.
    // For now, we'll return an empty array for lists or throw for single items.
    if (endpoint.includes('pagination')) {
      return { data: [], meta: { pagination: { page: 1, pageSize: 50, pageCount: 0, total: 0 } } } as any;
    }
    throw new Error("Strapi API token is not configured.");
  }

  const headers = {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
  };

  try {
    // Using a long revalidation time for now. This will be replaced by on-demand revalidation later.
    const response = await fetch(url, { headers, next: { revalidate: 3600 } }); 
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Strapi request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`Strapi request failed with status ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from Strapi endpoint "${endpoint}":`, error);
    // Depending on the context, you might want to return a default/empty value
    // or re-throw the error. For this app, we'll let it fail loudly during development.
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
             if (response.data && !Array.isArray(response.data)) {
               allResults.push(response.data as any);
             }
            break;
        }

        page++;
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
    return {
        documentId: item.attributes.documentId,
        title: item.attributes.title,
        slug: item.attributes.slug,
        excerpt: item.attributes.excerpt,
        contentHtml: item.attributes.Content, // Needs sanitization
        coverUrl: await getStrapiMediaUrl(item.attributes.cover?.data?.attributes.url),
        featured: item.attributes.featured ?? false,
        publishedAt: item.attributes.publishedAt,
        createdAt: item.attributes.createdAt,
        updatedAt: item.attributes.updatedAt,
        category: item.attributes.category.data ? {
            documentId: item.attributes.category.data.attributes.documentId,
            name: item.attributes.category.data.attributes.name,
            slug: item.attributes.category.data.attributes.slug,
        } : null,
        author: item.attributes.author.data ? {
            documentId: item.attributes.author.data.attributes.documentId,
            name: item.attributes.author.data.attributes.Name,
            avatarUrl: await getStrapiMediaUrl(item.attributes.author.data.attributes.Avatar?.data?.attributes.url)
        } : null,
        tags: item.attributes.tags.data.map(t => ({
            documentId: t.attributes.documentId,
            name: t.attributes.name,
            slug: t.attributes.slug,
        })),
        categorySlug: item.attributes.category.data?.attributes.slug,
        tagSlugs: item.attributes.tags.data.map(t => t.attributes.slug),
        authorName: item.attributes.author.data?.attributes.Name,
        seo: {
            metaTitle: item.attributes.seo?.metaTitle,
            metaDescription: item.attributes.seo?.metaDescription,
            ogImageUrl: await getStrapiMediaUrl(item.attributes.seo?.ogImage?.data?.attributes.url),
            canonicalUrl: item.attributes.seo?.canonicalUrl,
        }
    };
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

export async function getTags(): Promise<StrapiTag[]> {
    return fetchPaginated<StrapiTag>('/api/tags?populate=*');
}
