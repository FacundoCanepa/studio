import type {NextRequest} from 'next/server';

import {getArticles} from '@/service/articles';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');

  const page = parsePositiveInteger(pageParam);
  const pageSize = parsePositiveInteger(pageSizeParam);

  const data = await getArticles(page, pageSize);

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