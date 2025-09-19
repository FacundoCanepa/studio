import type {NextRequest} from 'next/server';

import {getProducts} from '@/service/products';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parsePositiveInteger(searchParams.get('page'));
  const pageSize = parsePositiveInteger(searchParams.get('pageSize'));
  const filtersQuery = extractFiltersQuery(searchParams);

  const data = await getProducts(page, pageSize, filtersQuery);

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

function extractFiltersQuery(searchParams: URLSearchParams): string | undefined {
  const filters = new URLSearchParams();
  const filterPrefixes = ['filter', 'filters'];

  for (const [key, value] of searchParams.entries()) {
    if (key === 'page' || key === 'pageSize') {
      continue;
    }

    const shouldInclude = filterPrefixes.some((prefix) =>
      key === prefix || key.startsWith(`${prefix}[`)
    );

    if (shouldInclude) {
      filters.append(key, value);
    }
  }

  const filtersString = filters.toString();

  if (!filtersString) {
    return undefined;
  }

  return filtersString;
}