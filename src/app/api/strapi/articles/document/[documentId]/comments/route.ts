import { NextResponse, type NextRequest } from 'next/server';
import {
  STRAPI_URL,
  missingStrapiUrlResponse,
  parseStrapiResponse,
} from '@/app/api/strapi/strapi-proxy';
import { qs } from '@/lib/qs';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

interface DocumentCommentsContext {
  params: { documentId: string };
}


// Sólo pedimos el id del usuario para ownership; el nombre viene del snapshot.
const USER_FIELDS_POPULATE = {
  fields: ['id'],
};

const COMMENT_FIELDS = ['content', 'estado', 'createdAt', 'updatedAt', 'author_displayName'];

function parsePaginationParam(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildCommentsQuery(documentId: string, page: number, pageSize: number) {
  return qs({
    filters: {
      article: { documentId: { $eq: documentId } },
      estado: { $eq: 'approved' },
      parent: { $null: true },
    },
    sort: ['createdAt:desc'],
    pagination: { page, pageSize },
    fields: COMMENT_FIELDS,
    populate: {
      users_permissions_user: USER_FIELDS_POPULATE,
      children: {
        fields: COMMENT_FIELDS,
        sort: [{ field: 'createdAt', order: 'asc' }],
        populate: {
          users_permissions_user: USER_FIELDS_POPULATE,
        },
      },
    },
  });
}

function extractErrorMessage(parsedBody: unknown, rawBody?: string) {
    if (parsedBody && typeof parsedBody === 'object') {
        const error = (parsedBody as Record<string, any>).error;
        if (typeof error === 'string') return error;
        if (error && typeof error === 'object' && 'message' in error) {
            const message = (error as Record<string, string>).message;
            if (typeof message === 'string') return message;
        }
    }
    return rawBody || 'Ocurrió un error al comunicarse con Strapi.';
}

export async function GET(request: NextRequest, { params }: DocumentCommentsContext) {
  const { documentId } = params;

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  if (!STRAPI_URL) {
    return missingStrapiUrlResponse();
  }

  const page = parsePaginationParam(request.nextUrl.searchParams.get('page'), DEFAULT_PAGE);
  const pageSize = parsePaginationParam(request.nextUrl.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
  const queryString = buildCommentsQuery(documentId, page, pageSize);
  const targetUrl = `${STRAPI_URL.replace(/\/$/, '')}/api/comments${queryString}`;

  const headers = new Headers({ Accept: 'application/json' });
  const authorization = request.headers.get('Authorization');
  if (authorization) {
    headers.set('Authorization', authorization);
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const { parsedBody, rawBody } = await parseStrapiResponse(response, 'STRAPI_DOCUMENT_COMMENTS');

    if (!response.ok) {
      const message = extractErrorMessage(parsedBody, rawBody);
      console.error(`[PROXY_COMMENTS_ERROR] Failed to fetch comments for doc ${documentId}. Status: ${response.status}. Message: ${message}`, { details: parsedBody });
      return NextResponse.json({ error: message, details: parsedBody }, { status: response.status });
    }

    return NextResponse.json(parsedBody);
  } catch (error) {
    console.error(`[PROXY_COMMENTS_EXCEPTION] Exception for doc ${documentId}`, error);
    return NextResponse.json({ error: 'Failed to fetch comments due to a network or server error.' }, { status: 502 });
  }
}
