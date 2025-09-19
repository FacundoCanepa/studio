'use server';

import { ArticleDoc, AuthorDoc, CategoryDoc, TagDoc } from './firestore-types';
import { StrapiArticle, StrapiAuthor, StrapiCategory, StrapiTag, StrapiGalleryItem } from '@/lib/strapi-types';
import { mapStrapiArticleToArticleDoc } from './strapi-mappers';
import { performStrapiRequest, getStrapiMediaUrl, STRAPI_REVALIDATE_SECONDS, type StrapiFetchOptions } from './strapi-api';
import { qs } from './qs';

const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

const MEDIA_FIELDS = ['url'] as const;

const ARTICLE_FIELDS = [
    'documentId',
    'title',
    'slug',
    'excerpt',
    'Content',
    'ContentMore',
    'featured',
    'home',
    'New',
    'Tendencias',
    // NOTE: Requesting the Strapi attribute named "type" triggers a 400 response
    // ("Invalid key type") in our production API. The value is optional and can be
    // derived from other metadata if needed, so we avoid requesting it explicitly.
    'Informacion',
    'UrlYoutube',
    'publishedAt',
    'createdAt',
    'updatedAt',
] as const;

const ARTICLE_SEO_FIELDS = ['metaTitle', 'metaDescription', 'canonicalUrl'] as const;

const CATEGORY_REQUIRED_FIELDS = ['documentId', 'name', 'slug'] as const;
type CategoryRequiredField = (typeof CATEGORY_REQUIRED_FIELDS)[number];

function parseCategoryOptionalFields(): string[] {
    const envValue = process.env.STRAPI_CATEGORY_OPTIONAL_FIELDS;
    if (!envValue) {
        return [];
    }

    return envValue
        .split(',')
        .map((field) => field.trim())
        .filter(
            (field) =>
                field.length > 0 && !CATEGORY_REQUIRED_FIELDS.includes(field as CategoryRequiredField),
        );
}

const CATEGORY_OPTIONAL_FIELDS = parseCategoryOptionalFields();
const CATEGORY_REQUEST_FIELDS: readonly (CategoryRequiredField | string)[] = [
    ...CATEGORY_REQUIRED_FIELDS,
    ...CATEGORY_OPTIONAL_FIELDS,
];
const CATEGORY_FALLBACK_FIELDS = CATEGORY_REQUIRED_FIELDS;
type CategoryField = CategoryRequiredField | string;

const AUTHOR_SUMMARY_FIELDS = ['documentId', 'Name'] as const;
const AUTHOR_DETAIL_FIELDS = ['documentId', 'Name', 'Bio', 'createdAt', 'updatedAt'] as const;

const TAG_SUMMARY_FIELDS = ['documentId', 'name', 'slug'] as const;
const TAG_FIELDS = ['documentId', 'name', 'slug', 'createdAt', 'updatedAt'] as const;

const GALLERY_FIELDS = ['documentId', 'Famoso', 'Nota'] as const;

const ARTICLE_POPULATE = {
    Cover: {
        fields: MEDIA_FIELDS,
    },
    Carosel: {
        fields: MEDIA_FIELDS,
    },
    category: {
        fields: CATEGORY_FALLBACK_FIELDS,
    },
    author: {
        fields: AUTHOR_SUMMARY_FIELDS,
        populate: {
            Avatar: {
                fields: MEDIA_FIELDS,
            },
        },
    },
    tags: {
        fields: TAG_SUMMARY_FIELDS,
    },
    Name: {
        fields: ARTICLE_SEO_FIELDS,
        populate: {
            ogImage: {
                fields: MEDIA_FIELDS,
            },
        },
    },
} as const; // removed populate=*

const AUTHOR_POPULATE = {
    Avatar: {
        fields: MEDIA_FIELDS,
    },
} as const; // removed populate=*

const CATEGORY_POPULATE = {
    img: {
        fields: MEDIA_FIELDS,
    },
} as const; // removed populate=*

const GALLERY_POPULATE = {
    Imagen: {
        fields: MEDIA_FIELDS,
    },
} as const; // removed populate=*

// This function checks if the required token is available.
// During the build process (`next build`), environment variables might not be available.
// This function allows the build to proceed without data, preventing a hard crash.
function isApiAvailable(): boolean {
    if (!STRAPI_TOKEN) {
        console.warn(`
        =============================================================================
        [STRAPI_CLIENT] WARNING: STRAPI_API_TOKEN is not available.
        Strapi API requests will be skipped, and empty data will be returned.
        This is expected during the build process if the token is not set.
        To fetch data, ensure STRAPI_API_TOKEN is set in your environment.
        See: docs/strapi-deployment-guide.md
        =============================================================================
        `);
        return false;
    }
    return true;
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
    if (!isApiAvailable()) return [];

    try {
        console.log('[GET_ARTICLES] Fetching articles with params:', { categorySlug, tagSlug, limit, filters });
        const filtersQuery: Record<string, any> = {};
        if (categorySlug) {
            filtersQuery.category = { slug: { $eq: categorySlug } };
        }
        if (tagSlug) {
            filtersQuery.tags = { slug: { $eq: tagSlug } };
        }
        if (filters.featured !== undefined) {
            filtersQuery.featured = { $eq: filters.featured };
        }
        if (filters.home !== undefined) {
            filtersQuery.home = { $eq: filters.home };
        }
        if (filters.isNew !== undefined) {
            filtersQuery.New = { $eq: filters.isNew };
        }
        if (filters.ids && filters.ids.length > 0) {
            filtersQuery.id = { $in: filters.ids };
        }

        const baseQuery: Record<string, any> = {
            sort: ['publishedAt:desc'],
            fields: ARTICLE_FIELDS,
            populate: ARTICLE_POPULATE, // removed populate=*
        };

        if (Object.keys(filtersQuery).length > 0) {
            baseQuery.filters = filtersQuery;
        }

        if (limit === -1) {
            baseQuery.publicationState = 'preview';
        }

        const originalLimit = limit;
        const normalizedLimit = typeof originalLimit === 'number' && originalLimit > 0 ? originalLimit : 12;
        const pageSize = Math.min(Math.max(normalizedLimit, 6), 12);
        let currentPage = 1;
        const strapiArticles: StrapiArticle[] = [];

        while (true) {
            const query = {
                ...baseQuery,
                pagination: {
                    page: currentPage,
                    pageSize,
                },
            };
            const queryString = qs(query);
            const response = await performStrapiRequest(`/api/articles${queryString}`, { method: 'GET', cache: cache ?? 'default' });
            const pageData: StrapiArticle[] = response.data || [];
            strapiArticles.push(...pageData);
            console.log(`[GET_ARTICLES] Fetched page ${currentPage} with ${pageData.length} raw articles from Strapi.`);

            const hasEnough = originalLimit !== undefined && originalLimit !== -1 && strapiArticles.length >= originalLimit;
            const needsAll = originalLimit === -1;
            const needsMoreForLimit = typeof originalLimit === 'number' && originalLimit > pageSize;

            if (pageData.length < pageSize || hasEnough || (!needsAll && !needsMoreForLimit)) {
                break;
            }

            currentPage += 1;
        }

        console.log(`[GET_ARTICLES] Aggregated ${strapiArticles.length} raw articles from Strapi.`);

        const mappedArticles = (await Promise.all(strapiArticles.map(mapStrapiArticleToArticleDoc))).filter(Boolean) as ArticleDoc[];
        console.log(`[GET_ARTICLES] Mapped ${mappedArticles.length} articles to ArticleDoc.`);
        if (originalLimit && originalLimit > 0) {
            return mappedArticles.slice(0, originalLimit);
        }
        return mappedArticles;
    } catch (error) {
        console.error('[GET_ARTICLES] Failed to fetch articles:', error);
        return []; // Return empty array on error to prevent build from failing.
    }
}

export async function getArticleBySlug(slug: string): Promise<ArticleDoc | null> {
    if (!isApiAvailable()) return null;
    try {
        console.log(`[GET_ARTICLE_BY_SLUG] Fetching article with slug: ${slug}`);
        const paginationSize = Math.min(Math.max(1, 6), 12);
        const query = {
            filters: {
                slug: { $eq: slug },
            },
            fields: ARTICLE_FIELDS,
            populate: ARTICLE_POPULATE, // removed populate=*
            pagination: {
                page: 1,
                pageSize: paginationSize,
            },
            publicationState: 'preview',
        };
        const queryString = qs(query);

        const response = await performStrapiRequest(`/api/articles${queryString}`, { method: 'GET', cache: 'no-store' });
        const articleData = response.data?.[0];

        if (!articleData) {
            console.warn(`[GET_ARTICLE_BY_SLUG] No article found for slug: ${slug}`);
            return null;
        }
        
        console.log(`[GET_ARTICLE_BY_SLUG] Found article, mapping...`);
        return await mapStrapiArticleToArticleDoc(articleData);
    } catch (error) {
        console.error(`[GET_ARTICLE_BY_SLUG] Failed to fetch article for slug ${slug}:`, error);
        return null;
    }
}

export async function getArticleByDocumentId(documentId: string): Promise<ArticleDoc | null> {
    if (!isApiAvailable()) return null;
    try {
        console.log(`[GET_ARTICLE_BY_DOCUMENT_ID] Fetching article with documentId: ${documentId}`);
        const paginationSize = Math.min(Math.max(1, 6), 12);
        const query = {
            filters: {
                documentId: { $eq: documentId },
            },
            fields: ARTICLE_FIELDS,
            populate: ARTICLE_POPULATE, // removed populate=*
            pagination: {
                page: 1,
                pageSize: paginationSize,
            },
            publicationState: 'preview',
        };

        const queryString = qs(query);
        const endpoint = `/api/articles${queryString}`;

        const response = await performStrapiRequest(endpoint, { method: 'GET', cache: 'no-store' });
        const articleData = response.data?.[0];

        if (!articleData) {
            console.warn(`[GET_ARTICLE_BY_DOCUMENT_ID] No article found for documentId: ${documentId}`);
            return null;
        }

        console.log(`[GET_ARTICLE_BY_DOCUMENT_ID] Found article, mapping...`);
        return await mapStrapiArticleToArticleDoc(articleData);
    } catch (error) {
         console.error(`[GET_ARTICLE_BY_DOCUMENT_ID] Error fetching article with documentId ${documentId}:`, error);
         return null;
    }
}


export async function getAuthors(options: { cache?: RequestCache } = {}): Promise<AuthorDoc[]> {
    if (!isApiAvailable()) return [];
    try {
        console.log('[GET_AUTHORS] Fetching all authors...');
        const pageSize = Math.min(Math.max(12, 6), 12);
        const baseQuery: Record<string, any> = {
            fields: AUTHOR_DETAIL_FIELDS,
            populate: AUTHOR_POPULATE, // removed populate=*
        };

        const authors: StrapiAuthor[] = [];
        let currentPage = 1;
        const cacheMode = (options.cache ?? 'default') as RequestCache;
        const requestOptions: StrapiFetchOptions = {
            method: 'GET',
            cache: cacheMode,
            ...(cacheMode === 'no-store'
                ? {}
                : {
                    next: {
                        revalidate: STRAPI_REVALIDATE_SECONDS, // high revalidate: read-mostly
                    },
                }),
        };

        while (true) {
            const query = {
                ...baseQuery,
                pagination: {
                    page: currentPage,
                    pageSize,
                },
            };
            const queryString = qs(query);
            const response = await performStrapiRequest(`/api/authors${queryString}`, requestOptions);
            const pageData: StrapiAuthor[] = response.data || [];
            authors.push(...pageData);
            console.log(`[GET_AUTHORS] Fetched page ${currentPage} with ${pageData.length} authors.`);

            if (pageData.length < pageSize) {
                break;
            }

            currentPage += 1;
        }

        console.log(`[GET_AUTHORS] Aggregated ${authors.length} authors.`);
        
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
    } catch (error) {
        console.error('[GET_AUTHORS] Failed to fetch authors:', error);
        return [];
    }
}

export async function getAuthor(documentId: string): Promise<AuthorDoc | null> {
    if (!isApiAvailable()) return null;
    try {
        console.log(`[GET_AUTHOR] Fetching author with documentId: ${documentId}`);
        const paginationSize = Math.min(Math.max(1, 6), 12);
        const query = {
            filters: {
                documentId: { $eq: documentId },
            },
            fields: AUTHOR_DETAIL_FIELDS,
            populate: AUTHOR_POPULATE, // removed populate=*
            pagination: {
                page: 1,
                pageSize: paginationSize,
            },
        };
        const queryString = qs(query);
        const response = await performStrapiRequest(`/api/authors${queryString}`, { method: 'GET', cache: 'no-store' });
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
function parseInvalidCategoryFields(error: unknown): CategoryField[] {
    const invalidFields = new Set<CategoryField>();

    if (!(error instanceof Error)) {
        return [];
    }

    const message = error.message ?? '';
    if (!message) {
        return [];
    }

    const jsonStartIndex = message.indexOf('{');
    if (jsonStartIndex !== -1) {
        const jsonPayload = message.slice(jsonStartIndex);
        try {
            const parsed = JSON.parse(jsonPayload);
            const detailsKey = parsed?.error?.details?.key;
            if (typeof detailsKey === 'string') {
                invalidFields.add(detailsKey);
                const normalizedKey = detailsKey.toLowerCase();
                if (normalizedKey !== detailsKey) {
                    invalidFields.add(normalizedKey);
                }
            }
        } catch {
            // Ignore JSON parsing errors and fall back to string matching.
        }
    }

    const normalizedMessage = message.toLowerCase();
    const match = normalizedMessage.match(/invalid key\s+([a-z0-9_\-]+)/i);
    if (match?.[1]) {
        invalidFields.add(match[1]);
    }
    if (normalizedMessage.includes('invalid key color') || normalizedMessage.includes('"key":"color"')) {
        invalidFields.add('color');
    }
    if (
        normalizedMessage.includes('invalid key description') ||
        normalizedMessage.includes('invalid key descripcion') ||
        normalizedMessage.includes('"key":"description"') ||
        normalizedMessage.includes('"key":"descripcion"')
    ) {
        invalidFields.add('description');
        invalidFields.add('descripcion');
    }

    return Array.from(invalidFields);
}

function resolveCategoryFieldRetry(
    attemptedFields: readonly CategoryField[],
    error: unknown,
): { fields: CategoryField[]; removed: CategoryField[] } | null {
    const invalidFields = parseInvalidCategoryFields(error);
    if (invalidFields.length === 0) {
        return null;
    }
    const attemptedLowerMap = new Map<string, CategoryField>();
    for (const field of attemptedFields) {
        attemptedLowerMap.set(field.toLowerCase(), field);
    }

    const removed = invalidFields
        .map((field) => attemptedLowerMap.get(field.toLowerCase()))
        .filter((field): field is CategoryField => typeof field === 'string');

    let nextFields: CategoryField[];
    if (removed.length > 0) {
        const removedSet = new Set(removed);
        nextFields = attemptedFields.filter((field): field is CategoryField => !removedSet.has(field));
    } else {
        nextFields = Array.from(CATEGORY_FALLBACK_FIELDS) as CategoryField[];
    }

    if (nextFields.length === 0) {
        nextFields = Array.from(CATEGORY_FALLBACK_FIELDS) as CategoryField[];
    }
    const seen = new Set<string>();
    for (const required of CATEGORY_REQUIRED_FIELDS) {
        const requiredLower = required.toLowerCase();
        if (!nextFields.some((field) => field.toLowerCase() === requiredLower)) {
            nextFields.push(required);
        }
    }

    nextFields = nextFields.filter((field) => {
        const key = field.toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
    const isSameFields =
        nextFields.length === attemptedFields.length &&
        nextFields.every((field, index) => field === attemptedFields[index]);

    if (isSameFields) {
        return null;
    }

    return {
        fields: nextFields,
        removed: removed.length > 0 ? removed : invalidFields,
    };
}
export async function getCategories(init?: RequestInit): Promise<CategoryDoc[]> {
    if (!isApiAvailable()) return [];
    try {
        console.log('[GET_CATEGORIES] Fetching all categories...');
        const pageSize = Math.min(Math.max(12, 6), 12);
        const baseQuery: Record<string, any> = {
            sort: ['name:asc'],
            populate: CATEGORY_POPULATE, // removed populate=*
        };

        const baseRequest = { method: 'GET', ...(init ?? {}) } as StrapiFetchOptions;
        const cacheMode = baseRequest.cache ?? 'default';
        const requestInit: StrapiFetchOptions = {
            ...baseRequest,
            cache: cacheMode,
            ...(cacheMode === 'no-store'
                ? {}
                : {
                      next: {
                          ...(baseRequest.next ?? {}),
                          revalidate: STRAPI_REVALIDATE_SECONDS, // high revalidate: read-mostly
                      },
                  }),
        };
        const fetchAllPages = async (fields: readonly CategoryField[]): Promise<StrapiCategory[]> => {
            const accumulated: StrapiCategory[] = [];
            let currentPage = 1;

            while (true) {
                const query = {
                    ...baseQuery,
                    ...(fields.length > 0 ? { fields: Array.from(fields) } : {}),
                    pagination: {
                        page: currentPage,
                        pageSize,
                    },
                };
                const queryString = qs(query);
                const response = await performStrapiRequest(`/api/categories${queryString}`, requestInit);
                const pageData: StrapiCategory[] = response.data || [];
                accumulated.push(...pageData);
                console.log(`[GET_CATEGORIES] Fetched page ${currentPage} with ${pageData.length} raw categories.`);

                if (pageData.length < pageSize) {
                    break;
                }

                currentPage += 1;
            }

            return accumulated;
        };

        const fetchCategoriesWithRetry = async (fields: readonly CategoryField[]): Promise<StrapiCategory[]> => {
            try {
                return await fetchAllPages(fields);
            } catch (error) {
                const retry = resolveCategoryFieldRetry(fields, error);
                if (!retry) {
                    throw error;
                }

                const removedLabel = retry.removed.join(', ') || 'unknown';
                console.warn(`[GET_CATEGORIES] Retrying without invalid category fields: ${removedLabel}.`);
                return fetchCategoriesWithRetry(retry.fields);
            }
        };

        const raw = await fetchCategoriesWithRetry(CATEGORY_REQUEST_FIELDS);

        console.log(`[GET_CATEGORIES] Aggregated ${raw.length} raw categories.`);

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
                description: (c as any)?.description ?? (c as any)?.Descripcion ?? (c as any)?.descripcion,
                color: c.color,
                imageUrl: await getStrapiMediaUrl(c.img?.url),
            };
        });

        const results = (await Promise.all(mapped)).filter(Boolean) as CategoryDoc[];
        console.log(`[GET_CATEGORIES] Mapped ${results.length} categories.`);
        return results;
    } catch (error) {
        console.error('[GET_CATEGORIES] Failed to fetch categories:', error);
        return [];
    }
}

export async function getCategory(slug: string): Promise<CategoryDoc | null> {
    if (!isApiAvailable()) return null;
    try {
        console.log(`[GET_CATEGORY] Fetching category with slug: ${slug}`);
        const paginationSize = Math.min(Math.max(1, 6), 12);
        const fetchCategoryData = async (fields: readonly CategoryField[]) => {
            const query = {
                filters: {
                    slug: { $eq: slug },
                },
                ...(fields.length > 0 ? { fields: Array.from(fields) } : {}),
                populate: CATEGORY_POPULATE, // removed populate=*
                pagination: {
                    page: 1,
                    pageSize: paginationSize,
                },
            };
            const queryString = qs(query);
            const response = await performStrapiRequest(`/api/categories${queryString}`, { method: 'GET', cache: 'no-store' });
            return response.data?.[0] as StrapiCategory | undefined;
        };

        const fetchCategoryWithRetry = async (
            fields: readonly CategoryField[],
        ): Promise<StrapiCategory | undefined> => {
            try {
                return await fetchCategoryData(fields);
            } catch (error) {
                const retry = resolveCategoryFieldRetry(fields, error);
                if (!retry) {
                    throw error;
                }

                const removedLabel = retry.removed.join(', ') || 'unknown';
                console.warn(
                    `[GET_CATEGORY] Retrying without invalid category fields (${removedLabel}) for slug: ${slug}.`,
                );
                return fetchCategoryWithRetry(retry.fields);
            }
        };

        const categoryData = await fetchCategoryWithRetry(CATEGORY_REQUEST_FIELDS);

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
            description: (categoryData as any)?.description ?? (categoryData as any)?.Descripcion ?? (categoryData as any)?.descripcion,
            color: categoryData.color,
            imageUrl: await getStrapiMediaUrl(categoryData.img?.url),
        };
    } catch(error) {
        console.error(`[GET_CATEGORY] Failed to fetch category for slug ${slug}:`, error);
        return null;
    }
}


export async function getTags(): Promise<TagDoc[]> {
    if (!isApiAvailable()) return [];
    try {
        console.log('[GET_TAGS] Fetching all tags...');
        const pageSize = Math.min(Math.max(12, 6), 12);
        const baseQuery: Record<string, any> = {
            fields: TAG_FIELDS,
        };

        const tags: StrapiTag[] = [];
        let currentPage = 1;

        while (true) {
            const query = {
                ...baseQuery,
                pagination: {
                    page: currentPage,
                    pageSize,
                },
            };
            const queryString = qs(query);
            const response = await performStrapiRequest(`/api/tags${queryString}`, { method: 'GET', cache: 'no-store' });
            const pageData: StrapiTag[] = response.data || [];
            tags.push(...pageData);
            console.log(`[GET_TAGS] Fetched page ${currentPage} with ${pageData.length} tags.`);

            if (pageData.length < pageSize) {
                break;
            }

            currentPage += 1;
        }

        console.log(`[GET_TAGS] Aggregated ${tags.length} tags.`);
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
    } catch (error) {
        console.error('[GET_TAGS] Failed to fetch tags:', error);
        return [];
    }
}

export async function getTag(slug: string): Promise<TagDoc | null> {
    if (!isApiAvailable()) return null;
    try {
        console.log(`[GET_TAG] Fetching tag with slug: ${slug}`);
        const paginationSize = Math.min(Math.max(1, 6), 12);
        const query = {
            filters: {
                slug: { $eq: slug },
            },
            fields: TAG_FIELDS,
            pagination: {
                page: 1,
                pageSize: paginationSize,
            },
        };
        const queryString = qs(query);
        const response = await performStrapiRequest(`/api/tags${queryString}`, { method: 'GET', cache: 'no-store' });
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
    } catch(error) {
        console.error(`[GET_TAG] Failed to fetch tag for slug ${slug}:`, error);
        return null;
    }
}

export async function getGalleryItems(): Promise<{ id: string; title: string; description: string; imageUrl: string }[]> {
  if (!isApiAvailable()) return [];
  try {
    console.log('[GET_GALLERY_ITEMS] Fetching gallery items...');
    const pageSize = Math.min(Math.max(12, 6), 12);
    const baseQuery: Record<string, any> = {
      fields: GALLERY_FIELDS,
      populate: GALLERY_POPULATE, // removed populate=*
    };

    const galleryItems: StrapiGalleryItem[] = [];
    let currentPage = 1;

    while (true) {
      const query = {
        ...baseQuery,
        pagination: {
          page: currentPage,
          pageSize,
        },
      };
      const queryString = qs(query);
      const response = await performStrapiRequest(`/api/Galerias${queryString}`, { method: 'GET', cache: 'no-store' });
      const pageData: StrapiGalleryItem[] = response.data || [];
      galleryItems.push(...pageData);
      console.log(`[GET_GALLERY_ITEMS] Fetched page ${currentPage} with ${pageData.length} gallery items.`);

      if (pageData.length < pageSize) {
        break;
      }

      currentPage += 1;
    }

    console.log(`[GET_GALLERY_ITEMS] Aggregated ${galleryItems.length} gallery items.`);

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
  } catch(error) {
    console.error('[GET_GALLERY_ITEMS] Failed to fetch gallery items:', error);
    return [];
  }
}


export async function getFavoriteArticles(userId: number, jwt: string): Promise<ArticleDoc[]> {
    if (!isApiAvailable()) return [];
    try {
        console.log(`[GET_FAVORITE_ARTICLES] Fetching for user ID: ${userId}`);
        const query = {
            populate: {
                favorite_articles: {
                    fields: ARTICLE_FIELDS,
                    populate: ARTICLE_POPULATE, // removed populate=*
                },
            }, // removed populate=*
        };
        const queryString = qs(query);
        const user = await performStrapiRequest(`/api/users/${userId}${queryString}`, {
            method: 'GET',
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
    } catch(error) {
        console.error(`[GET_FAVORITE_ARTICLES] Failed to fetch favorite articles for user ${userId}:`, error);
        return [];
    }
}

export async function getFavoriteTags(userId: number, jwt: string): Promise<TagDoc[]> {
    if (!isApiAvailable()) return [];
    try {
        console.log(`[GET_FAVORITE_TAGS] Fetching for user ID: ${userId}`);
        const query = {
            populate: {
                favorite_tags: {
                    fields: TAG_FIELDS,
                },
            }, // removed populate=*
        };
        const queryString = qs(query);
        const user = await performStrapiRequest(`/api/users/${userId}${queryString}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${jwt}` },
            cache: 'no-store'
        });
        if (!user || !user.favorite_tags) {
            console.log(`[GET_FAVORITE_TAGS] User ${userId} has no favorite tags.`);
            return [];
        }

        console.log(`[GET_FAVORITE_TAGS] Found ${user.favorite_tags.length} favorite tags for user ${userId}.`);
        return user.favorite_tags.map((tag: StrapiTag) => ({
            id: tag.id,
            documentId: tag.documentId,
            name: tag.name,
            slug: tag.slug,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
        }));
    } catch (error) {
        console.error(`[GET_FAVORITE_TAGS] Failed to fetch favorite tags for user ${userId}:`, error);
        return [];
    }
}

// Modified endpoints:
// - GET /api/articles
// - GET /api/authors
// - GET /api/categories
// - GET /api/tags
// - GET /api/Galerias
// - GET /api/users/:id