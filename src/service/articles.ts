'use server';

import { fetchStrapi } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';
import {
  ARTICLE_FIELDS,
  AUTHOR_AVATAR_FIELDS,
  AUTHOR_FIELDS,
  CATEGORY_FIELDS,
  COVER_FIELDS,
  TAG_FIELDS,
} from '@/lib/strapi-article-fields';
import type { StrapiArticle, StrapiResponse } from '@/lib/strapi-types';

type ArticlesResponse = StrapiResponse<StrapiArticle[]>;
export type GetArticlesOptions = {
  category?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  home?: boolean;
};


export async function getArticles(
  page = 1,
  pageSize = 12,
  options: GetArticlesOptions = {}
): Promise<ArticlesResponse> {
  const filters: Record<string, unknown> = {};

  if (options.category) {
    filters.category = {slug: {$eq: options.category}};
  }

  if (options.tag) {
    filters.tags = {slug: {$eq: options.tag}};
  }

  if (options.search) {
    const trimmedSearch = options.search.trim();

    if (trimmedSearch) {
      filters.$or = [
        {title: {$containsi: trimmedSearch}},
        {excerpt: {$containsi: trimmedSearch}},
        {Content: {$containsi: trimmedSearch}},
      ];
    }
  }

  if (options.featured !== undefined) {
    filters.featured = {$eq: options.featured};
  }
  if (options.isNew !== undefined) {
    filters.New = {$eq: options.isNew};
  }

  if (options.home !== undefined) {
    filters.home = {$eq: options.home};
  }

  const query: Record<string, unknown> = {
    sort: ['publishedAt:desc'],
    pagination: {
      page,
      pageSize,
    },
    fields: ARTICLE_FIELDS,
    populate: {
      Cover: {
        fields: COVER_FIELDS,
      },
      category: {
        fields: CATEGORY_FIELDS,
      },
      author: {
        fields: AUTHOR_FIELDS,
        populate: {
          Avatar: {
            fields: AUTHOR_AVATAR_FIELDS,
          },
        },
      },
      tags: {
        fields: TAG_FIELDS,
      },
    },
  };
  if (Object.keys(filters).length > 0) {
    query.filters = filters;
  }
  const queryString = qs(query);
  return fetchStrapi<ArticlesResponse>(`/api/articles${queryString}`);
}