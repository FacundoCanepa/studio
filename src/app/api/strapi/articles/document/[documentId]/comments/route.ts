import { NextResponse } from 'next/server';

import { qs } from '@/lib/qs';
import { proxyStrapiRequest } from '../../../../strapi-proxy';

export const dynamic = 'force-dynamic';

interface DocumentCommentsContext {
  params: { documentId: string };
}

function buildPath(documentId: string) {
  return `articles/document/${encodeURIComponent(documentId)}/comments`;
}

export async function GET(request: Request, { params }: DocumentCommentsContext) {
  const primaryResponse = await proxyStrapiRequest(
    request,
    buildPath(params.documentId),
    {
      context: 'STRAPI_DOCUMENT_COMMENTS',
    }
  );

  if (primaryResponse.status !== 404) {
    return primaryResponse;
  }

  const fallbackRequest = buildFallbackRequest(request, params.documentId);

  const fallbackResponse = await proxyStrapiRequest(fallbackRequest, 'comments', {
    context: 'STRAPI_DOCUMENT_COMMENTS_FALLBACK',
  });

  if (!fallbackResponse.ok) {
    return fallbackResponse;
  }

  const fallbackClone = fallbackResponse.clone();

  try {
    const fallbackBody = await fallbackClone.json();
    renameUsersPermissionsUserToAuthor(fallbackBody);

    return NextResponse.json(fallbackBody, { status: fallbackResponse.status });
  } catch (error) {
    console.error('[STRAPI_DOCUMENT_COMMENTS_FALLBACK_TRANSFORM_ERROR]', error);
  }

  return fallbackResponse;
}

export async function POST(request: Request, { params }: DocumentCommentsContext) {
  return proxyStrapiRequest(request, buildPath(params.documentId), {
    context: 'STRAPI_DOCUMENT_COMMENTS',
  });
}

function parsePositiveInteger(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function buildFallbackQuery(documentId: string, url: URL) {
  const page = parsePositiveInteger(url.searchParams.get('page')) ?? 1;
  const pageSize = parsePositiveInteger(url.searchParams.get('pageSize')) ?? 10;

  const populateAuthor = {
    fields: ['username', 'name'],
    populate: {
      avatar: {
        fields: ['url'],
      },
    },
  };

  const nestedChildrenPopulate = {
    populate: {
      users_permissions_user: populateAuthor,
      children: {
        populate: {
          users_permissions_user: populateAuthor,
          children: {
            populate: {
              users_permissions_user: populateAuthor,
            },
          },
        },
      },
    },
  };

  const query = {
    filters: {
      article: {
        documentId: {
          $eq: documentId,
        },
      },
      parent: {
        $null: true,
      },
    },
    populate: {
      users_permissions_user: populateAuthor,
      children: nestedChildrenPopulate,
    },
    sort: ['createdAt:desc'],
    pagination: {
      page,
      pageSize,
    },
  };

  return qs(query);
}

export function renameUsersPermissionsUserToAuthor(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(renameUsersPermissionsUserToAuthor);
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const record = value as Record<string, unknown>;

  if ('users_permissions_user' in record && !('author' in record)) {
    record.author = record.users_permissions_user;
    delete record.users_permissions_user;
  }

  for (const key of Object.keys(record)) {
    renameUsersPermissionsUserToAuthor(record[key]);
  }
}

function buildFallbackRequest(originalRequest: Request, documentId: string) {
  const originalUrl = new URL(originalRequest.url);
  const fallbackUrl = new URL(originalUrl.toString());

  fallbackUrl.pathname = '/api/strapi/comments';
  fallbackUrl.search = buildFallbackQuery(documentId, originalUrl);

  const headers = new Headers();
  originalRequest.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Request(fallbackUrl.toString(), {
    method: 'GET',
    headers,
  });
}