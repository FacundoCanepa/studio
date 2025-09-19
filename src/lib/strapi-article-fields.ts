import type { StrapiArticle } from '@/lib/strapi-types';

export const ARTICLE_FIELDS: Array<keyof StrapiArticle | string> = [
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
  // NOTE: The Strapi API rejects requests for the "type" attribute with
  // "Invalid key type". We skip it here because the field is optional for the app.
  'subcategories',
  'Informacion',
  'UrlYoutube',
  'createdAt',
  'updatedAt',
  'publishedAt',
];

export const COVER_FIELDS = [
  'url',
  'alternativeText',
  'caption',
  'width',
  'height',
  'formats',
];

export const CATEGORY_FIELDS = ['name', 'slug', 'documentId'];

export const AUTHOR_FIELDS = ['Name', 'documentId'];

export const AUTHOR_AVATAR_FIELDS = [
  'url',
  'alternativeText',
  'caption',
  'width',
  'height',
  'formats',
];

export const TAG_FIELDS = ['name', 'slug', 'documentId'];