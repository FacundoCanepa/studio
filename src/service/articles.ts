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


export async function getArticles(page = 1, pageSize = 12): Promise<ArticlesResponse> {
  const query = {
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

  const queryString = qs(query);
  return fetchStrapi<ArticlesResponse>(`/api/articles${queryString}`);
}