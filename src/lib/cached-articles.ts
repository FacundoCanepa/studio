'use server';

import type { ArticleDoc } from './firestore-types';
import { mapStrapiArticleToArticleDoc } from './strapi-mappers';
import type { StrapiArticle, StrapiResponse } from './strapi-types';

export type CachedArticlesParams = {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  home?: boolean;
};

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export type CachedArticlesResult = {
  articles: ArticleDoc[];
  meta: StrapiResponse<StrapiArticle[]>['meta'];
};

const DEFAULT_REVALIDATE_SECONDS = 900;

function resolveBaseUrl(): string {
  const envUrl =
    process.env.FRONT_ORIGIN_PROD ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL;

  if (envUrl) {
    if (envUrl.startsWith('http')) {
      return envUrl;
    }
    return `https://${envUrl}`;
  }

  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}

function buildSearchParams(params: CachedArticlesParams): string {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.pageSize) {
    searchParams.set('pageSize', String(params.pageSize));
  }

  if (params.category) {
    searchParams.set('category', params.category);
  }

  if (params.tag) {
    searchParams.set('tag', params.tag);
  }

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.featured !== undefined) {
    searchParams.set('featured', String(params.featured));
  }

  if (params.isNew !== undefined) {
    searchParams.set('isNew', String(params.isNew));
  }

  if (params.home !== undefined) {
    searchParams.set('home', String(params.home));
  }

  const queryString = searchParams.toString();
  return queryString;
}

export async function fetchCachedArticles(
  params: CachedArticlesParams = {},
  options: NextFetchOptions = {}
): Promise<CachedArticlesResult> {
  const baseUrl = resolveBaseUrl();
  const query = buildSearchParams(params);
  const url = `${baseUrl}/api/cache/articles${query ? `?${query}` : ''}`;

  const fetchOptions: NextFetchOptions = {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    next: {
      revalidate: options.next?.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
      ...options.next,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      console.error('[fetchCachedArticles] Unexpected response status', {
        status: response.status,
        statusText: response.statusText,
        url,
      });
      return { articles: [], meta: {} };
    }

    const payload = (await response.json()) as StrapiResponse<StrapiArticle[]>;
    const mapped = await Promise.all((payload.data ?? []).map(mapStrapiArticleToArticleDoc));
    const articles = mapped.filter(Boolean) as ArticleDoc[];

    return { articles, meta: payload.meta ?? {} };
  } catch (error) {
    console.error('[fetchCachedArticles] Failed to load cached articles', error);
    return { articles: [], meta: {} };
  }
}