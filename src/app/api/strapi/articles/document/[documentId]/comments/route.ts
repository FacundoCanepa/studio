import { NextResponse, type NextRequest } from 'next/server';
import {
  STRAPI_URL,
  missingStrapiUrlResponse,
  parseStrapiResponse,
} from '../../../../strapi-proxy';
import { qs } from '@/lib/qs';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

interface DocumentCommentsContext {
  params: { documentId: string };
}

interface StrapiAvatarAttributes {
  url?: string;
}

interface StrapiAvatarEntity {
  id: number;
  attributes?: StrapiAvatarAttributes | null;
}

interface StrapiAvatarRelation {
  data?: StrapiAvatarEntity | null;
}

interface StrapiUserAttributes {
  username?: string;
  email?: string;
  name?: string;
  avatar?: StrapiAvatarRelation | null;
}

interface StrapiUserEntity {
  id: number;
  attributes?: StrapiUserAttributes | null;
}

interface StrapiUserRelation {
  data?: StrapiUserEntity | null;
}

interface StrapiCommentAttributes {
  content?: string;
  body?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: StrapiUserRelation | null;
  users_permissions_user?: StrapiUserRelation | null;
  children?: { data?: StrapiCommentEntity[] | null } | null;
}

interface StrapiCommentEntity {
  id: number;
  attributes?: StrapiCommentAttributes | null;
}

interface StrapiPaginationMeta {
  page?: number;
  pageSize?: number;
  pageCount?: number;
  total?: number;
}

interface StrapiCommentsResponse {
  data?: StrapiCommentEntity[] | null;
  meta?: {
    pagination?: StrapiPaginationMeta | null;
  } | null;
}

export interface CommentAuthor {
  id: number;
  username: string;
  name?: string;
  avatar?: { url?: string };
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  estado?: string;
  author: CommentAuthor;
  children: Comment[];
}

export interface CommentsApiResponse {
  data: Comment[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

const USER_POPULATE = {
  fields: ['id', 'username', 'email', 'name'],
  populate: {
    avatar: {
      fields: ['url', 'formats'],
    },
  },
};
const COMMENT_FIELDS = ['content', 'estado', 'createdAt', 'updatedAt'];

function parsePaginationParam(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
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
      users_permissions_user: USER_POPULATE,
      children: {
        fields: COMMENT_FIELDS,
        sort: ['createdAt:asc'],
        populate: {
          users_permissions_user: USER_POPULATE,
          children: {
            fields: COMMENT_FIELDS,
            sort: ['createdAt:asc'],
            populate: {
              users_permissions_user: USER_POPULATE,
            },
          },
        },
      },
    },
  });
}

export function buildFallbackQuery(documentId: string, url: URL) {
  const page = parsePaginationParam(url.searchParams.get('page'), DEFAULT_PAGE);
  const pageSize = parsePaginationParam(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
  return buildCommentsQuery(documentId, page, pageSize);
}

export function renameUsersPermissionsUserToAuthor(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => renameUsersPermissionsUserToAuthor(item));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, any>;

    if (Object.prototype.hasOwnProperty.call(record, 'users_permissions_user')) {
      record.author = renameUsersPermissionsUserToAuthor(record.users_permissions_user);
      delete record.users_permissions_user;
    }

    for (const key of Object.keys(record)) {
      record[key] = renameUsersPermissionsUserToAuthor(record[key]);
    }

    return record;
  }

  return value;
}

function resolveAuthor(relation?: StrapiUserRelation | null): CommentAuthor {
  const user = relation?.data ?? null;
  const attributes = user?.attributes ?? {};
  const username = attributes?.username ?? 'Usuario';
  const name = attributes?.name ?? attributes?.username;
  const avatarUrl = attributes?.avatar?.data?.attributes?.url;

  const author: CommentAuthor = {
    id: typeof user?.id === 'number' ? user.id : 0,
    username,
  };

  if (name) {
    author.name = name;
  }

  if (avatarUrl) {
    author.avatar = { url: avatarUrl };
  }

  return author;
}

function mapStrapiComment(entity: StrapiCommentEntity): Comment {
  const attributes = entity.attributes ?? {};
  const rawChildren = attributes.children?.data ?? [];
  const relation = attributes.author ?? attributes.users_permissions_user ?? undefined;

  return {
    id: entity.id,
    content: attributes.content ?? attributes.body ?? '',
    createdAt: attributes.createdAt ?? '',
    estado: attributes.estado ?? undefined,
    updatedAt: attributes.updatedAt ?? attributes.createdAt ?? '',
    author: resolveAuthor(relation),
    children: Array.isArray(rawChildren)
      ? rawChildren.map((child) => mapStrapiComment(child))
      : [],
  };
}

function extractErrorMessage(parsedBody: unknown, rawBody?: string) {
  if (parsedBody && typeof parsedBody === 'object') {
    const body = parsedBody as Record<string, unknown>;
    const error = body.error;

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === 'string') {
        return message;
      }
    }

    const message = body.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  if (typeof parsedBody === 'string') {
    return parsedBody;
  }

  if (rawBody && rawBody.trim().length > 0) {
    return rawBody;
  }

  return 'Ocurrió un error al comunicarse con Strapi.';
}

function ensurePagination(
  pagination: StrapiPaginationMeta | null | undefined,
  fallbackPage: number,
  fallbackPageSize: number,
  totalItems: number,
) {
  const page = (pagination && typeof pagination.page === 'number' && pagination.page > 0)
    ? pagination.page
    : fallbackPage;
  const pageSize = (pagination && typeof pagination.pageSize === 'number' && pagination.pageSize > 0)
    ? pagination.pageSize
    : fallbackPageSize;
  const total = (pagination && typeof pagination.total === 'number' && pagination.total >= 0)
    ? pagination.total
    : totalItems;
  const computedPageCount = pagination && typeof pagination.pageCount === 'number' && pagination.pageCount > 0
    ? pagination.pageCount
    : Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));

  return {
    page,
    pageSize,
    pageCount: computedPageCount,
    total,
  };
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

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  const authorization = request.headers.get('Authorization');
  if (authorization) {
    headers.set('Authorization', authorization);
  }

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const { parsedBody, rawBody } = await parseStrapiResponse(response, 'STRAPI_DOCUMENT_COMMENTS');

  if (!response.ok) {
    const message = extractErrorMessage(parsedBody, rawBody);
    return NextResponse.json({ error: message }, { status: response.status });
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    return NextResponse.json(
      { error: 'Strapi no devolvió una respuesta válida.' },
      { status: 502 },
    );
  }

  const renamedBody = renameUsersPermissionsUserToAuthor(parsedBody) as StrapiCommentsResponse;
  const strapiData = Array.isArray(renamedBody.data) ? renamedBody.data : [];
  const comments = strapiData.map((entity) => mapStrapiComment(entity));
  const pagination = ensurePagination(
    renamedBody.meta?.pagination ?? undefined,
    page,
    pageSize,
    renamedBody.meta?.pagination?.total ?? comments.length,
  );

  const payload: CommentsApiResponse = {
    data: comments,
    meta: {
      pagination,
    },
  };

  return NextResponse.json(payload);
}