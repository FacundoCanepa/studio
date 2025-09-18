'use server';

import { fetchStrapi } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';
import type { StrapiArticle, StrapiResponse } from '@/lib/strapi-types';

type ArticlesResponse = StrapiResponse<StrapiArticle[]>;

const ARTICLE_FIELDS: Array<keyof StrapiArticle | string> = [
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
  'views',
  'saves',
  'type',
  'subcategories',
  'Informacion',
  'UrlYoutube',
  'createdAt',
  'updatedAt',
  'publishedAt',
];

const COVER_FIELDS = [
  'url',
  'alternativeText',
  'caption',
  'width',
  'height',
  'formats',
];

const CATEGORY_FIELDS = ['name', 'slug', 'documentId'];

const AUTHOR_FIELDS = ['Name', 'documentId'];

const AUTHOR_AVATAR_FIELDS = [
  'url',
  'alternativeText',
  'caption',
  'width',
  'height',
  'formats',
];

const TAG_FIELDS = ['name', 'slug', 'documentId'];

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