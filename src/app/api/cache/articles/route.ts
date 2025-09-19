import type {NextRequest} from 'next/server';

import {getArticles, type GetArticlesOptions} from '@/service/articles';


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');

  const page = parsePositiveInteger(pageParam);
  const pageSize = parsePositiveInteger(pageSizeParam);

  const category = parseNonEmptyString(searchParams.get('category'));
  const tag = parseNonEmptyString(searchParams.get('tag'));
  const search = parseNonEmptyString(searchParams.get('search'));
  const featured = parseBoolean(searchParams.get('featured'));

  const isNew = parseBoolean(searchParams.get('isNew'));
  const home = parseBoolean(searchParams.get('home'));
  
  const filters: GetArticlesOptions = {};

  if (category) {
    filters.category = category;
  }

  if (tag) {
    filters.tag = tag;
  }

  if (search) {
    filters.search = search;
  }

  if (featured !== undefined) {
    filters.featured = featured;
  }

  if (isNew !== undefined) {
    filters.isNew = isNew;
  }

  if (home !== undefined) {
    filters.home = home;
  }


  const data = await getArticles(page, pageSize, filters);


  return Response.json(data, {
    headers: {
      'Cache-Control': 's-maxage=900, stale-while-revalidate=3600',
    },
  });
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return undefined;
  }

  return parsed;
}

function parseNonEmptyString(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
}