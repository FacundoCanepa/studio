'use server';

import { fetchStrapi } from '@/lib/strapi-api';
import { qs } from '@/lib/qs';
import type { StrapiProduct, StrapiResponse } from '@/lib/strapi-types';

type ProductsResponse = StrapiResponse<StrapiProduct[]>;

const PRODUCT_FIELDS: Array<keyof StrapiProduct | string> = [
  'documentId',
  'productName',
  'slug',
  'price',
  'description',
  'unidadMedida',
];

const IMG_FIELDS = ['url', 'width', 'height', 'formats'];

const CATEGORY_FIELDS = ['documentId', 'name', 'slug'];

const INGREDIENT_FIELDS = ['documentId', 'nombre'];

export async function getProducts(
  page = 1,
  pageSize = 12
): Promise<ProductsResponse> {
  const query = {
    pagination: {
      page,
      pageSize: Math.min(pageSize, 12),
    },
    fields: PRODUCT_FIELDS,
    populate: {
      img: {
        fields: IMG_FIELDS,
      },
      category: {
        fields: CATEGORY_FIELDS,
      },
      ingredientes: {
        fields: INGREDIENT_FIELDS,
      },
    },
  };

  const queryString = qs(query);

  return fetchStrapi<ProductsResponse>(`/api/products${queryString}`);
}