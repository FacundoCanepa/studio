import { qs } from '@/lib/qs';

export const COMMENTS_REVALIDATE_SECONDS = 60;
export const COMMENTS_TAG = 'comments';

export function buildCommentsTag(documentId: string): string {
  return `${COMMENTS_TAG}:${documentId}`;
}

const COMMENT_FIELDS = ['content', 'estado', 'createdAt', 'updatedAt'];

const USER_FIELDS = ['id', 'username', 'email', 'name', 'displayName'];

const ARTICLE_FIELDS = ['documentId'];

export function buildCommentsQuery(documentId: string, page: number, pageSize: number): string {
  return qs({
    filters: {
      article: { documentId: { $eq: documentId } },
      estado: { $eq: 'approved' },
    },
    sort: ['createdAt:desc'],
    pagination: { page, pageSize },
    fields: COMMENT_FIELDS,
    populate: {
      author: {
        fields: USER_FIELDS,
      },
      users_permissions_user: {
        fields: USER_FIELDS,
      },
      parent: {
        fields: ['id'],
      },
      children: {
        fields: COMMENT_FIELDS,
        sort: ['createdAt:asc'],
        populate: {
          author: { fields: USER_FIELDS },
          users_permissions_user: { fields: USER_FIELDS },
          parent: { fields: ['id'] },
          children: {
            fields: COMMENT_FIELDS,
            sort: ['createdAt:asc'],
            populate: {
              author: { fields: USER_FIELDS },
              users_permissions_user: { fields: USER_FIELDS },
              parent: { fields: ['id'] },
            },
          },
        },
      },
      article: {
        fields: ARTICLE_FIELDS,
      },
    },
  });
}

type Nullable<T> = T | null | undefined;

interface StrapiRelation<TAttributes = Record<string, unknown>> {
  data?: {
    id?: number | string | null;
    attributes?: Nullable<TAttributes>;
  } | null;
  id?: number | string | null;
  attributes?: Nullable<TAttributes>;
  [key: string]: unknown;
}

interface StrapiUserAttributes {
  username?: string | null;
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
}

interface StrapiCommentAttributes {
  content?: string | null;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  estado?: string | null;
  author?: Nullable<StrapiRelation<StrapiUserAttributes>>;
  users_permissions_user?: Nullable<StrapiRelation<StrapiUserAttributes>>;
  parent?: Nullable<StrapiRelation>;
  children?: Nullable<{ data?: Nullable<StrapiCommentEntity[]> }>;
  article?: Nullable<StrapiRelation<{ documentId?: string | null }>>;
}

export interface StrapiCommentEntity {
  id?: number | string | null;
  attributes?: Nullable<StrapiCommentAttributes>;
  [key: string]: unknown;
}

export interface StrapiCommentsResponse {
  data?: Nullable<StrapiCommentEntity[]>;
  meta?: {
    pagination?: Nullable<{
      page?: number | null;
      pageSize?: number | null;
      pageCount?: number | null;
      total?: number | null;
    }>;
  } | null;
}

export interface StrapiSingleCommentResponse {
  data?: Nullable<StrapiCommentEntity>;
}

export interface CommentAuthorDto {
  id: number | null;
  displayName: string;
}

export interface CommentDto {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  estado: string | null;
  parentId: number | null;
  author: CommentAuthorDto;
  children: CommentDto[];
}

export interface CommentsPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface NormalizedCommentsResponse {
  comments: CommentDto[];
  pagination: CommentsPagination;
}

export interface NormalizedSingleComment {
  comment: CommentDto;
  articleDocumentId: string | null;
}

function toNumberId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeDate(value: unknown, fallback: string): string {
  if (isNonEmptyString(value)) {
    return value;
  }
  return fallback;
}

function extractRelationAttributes(
  relation: Nullable<StrapiRelation<StrapiUserAttributes>>,
): { id: number | null; attributes: Record<string, unknown> } | null {
  if (!relation || typeof relation !== 'object') {
    return null;
  }

  if (relation.data && typeof relation.data === 'object') {
    const id = toNumberId(relation.data.id ?? relation.id);
    const attributes = (relation.data.attributes ?? relation.attributes ?? {}) as Record<string, unknown>;
    return { id: id ?? null, attributes };
  }

  const id = toNumberId(relation.id);
  const attributes = (relation.attributes ?? relation) as Record<string, unknown>;
  return { id: id ?? null, attributes };
}

function resolveAuthor(
  relation: Nullable<StrapiRelation<StrapiUserAttributes>>,
): CommentAuthorDto {
  const fallback: CommentAuthorDto = { id: null, displayName: 'Usuario' };
  const extracted = extractRelationAttributes(relation);

  if (!extracted) {
    return fallback;
  }

  const { id, attributes } = extracted;
  const candidates = [
    attributes.displayName,
    attributes.name,
    attributes.username,
    attributes.email,
  ];

  const displayName = candidates.find(isNonEmptyString) ?? fallback.displayName;

  return {
    id,
    displayName,
  };
}

function mapChildren(children: Nullable<StrapiCommentEntity[]>): CommentDto[] {
  if (!Array.isArray(children) || children.length === 0) {
    return [];
  }

  return children
    .map((child) => normalizeStrapiComment(child))
    .filter((child): child is CommentDto => child !== null);
}

function extractArticleDocumentIdFromRelation(
  relation: Nullable<StrapiRelation<{ documentId?: string | null }>>,
): string | null {
  if (!relation || typeof relation !== 'object') {
    return null;
  }

  const source = relation.data ?? relation;
  const attributes = (source?.attributes ?? {}) as Record<string, unknown>;
  const candidates = [
    attributes.documentId,
    attributes.documentID,
    (source as Record<string, unknown>).documentId,
    (source as Record<string, unknown>).documentID,
  ];

  const documentId = candidates.find(isNonEmptyString);
  return documentId ? documentId.trim() : null;
}

function normalizeStrapiComment(entity: Nullable<StrapiCommentEntity>): CommentDto | null {
  if (!entity || typeof entity !== 'object') {
    return null;
  }

  const id = toNumberId(entity.id);
  const attributes = (entity.attributes ?? {}) as StrapiCommentAttributes;

  if (id === null && !attributes) {
    return null;
  }

  const createdAt = normalizeDate(attributes?.createdAt, new Date().toISOString());
  const updatedAt = normalizeDate(attributes?.updatedAt, createdAt);
  const parentId = toNumberId(attributes?.parent?.data?.id ?? attributes?.parent?.id);

  const authorRelation =
    attributes?.author ?? attributes?.users_permissions_user ?? undefined;

  const childrenEntities = attributes?.children?.data ?? [];

  return {
    id: id ?? 0,
    content:
      (isNonEmptyString(attributes?.content)
        ? attributes?.content
        : isNonEmptyString(attributes?.body)
          ? attributes?.body
          : '') ?? '',
    createdAt,
    updatedAt,
    estado: isNonEmptyString(attributes?.estado) ? attributes?.estado : null,
    parentId: parentId ?? null,
    author: resolveAuthor(authorRelation ?? undefined),
    children: mapChildren(childrenEntities as Nullable<StrapiCommentEntity[]>),
  };
}

function ensurePagination(
  pagination: Nullable<{
    page?: number | null;
    pageSize?: number | null;
    pageCount?: number | null;
    total?: number | null;
  }>,
  fallback: { page: number; pageSize: number; total: number },
): CommentsPagination {
  const page =
    typeof pagination?.page === 'number' && pagination.page > 0
      ? pagination.page
      : fallback.page;
  const pageSize =
    typeof pagination?.pageSize === 'number' && pagination.pageSize > 0
      ? pagination.pageSize
      : fallback.pageSize;
  const total =
    typeof pagination?.total === 'number' && pagination.total >= 0
      ? pagination.total
      : fallback.total;

  const computedPageCount =
    typeof pagination?.pageCount === 'number' && pagination.pageCount > 0
      ? pagination.pageCount
      : Math.max(1, Math.ceil((total || 0) / Math.max(pageSize, 1)));

  return {
    page,
    pageSize,
    pageCount: computedPageCount,
    total,
  };
}

export function normalizeCommentsResponse(
  payload: Nullable<StrapiCommentsResponse>,
  options: { page: number; pageSize: number },
): NormalizedCommentsResponse {
  const rawData = payload?.data ?? [];
  const comments = Array.isArray(rawData)
    ? rawData
        .map((entity) => normalizeStrapiComment(entity))
        .filter((comment): comment is CommentDto => comment !== null)
    : [];

  const pagination = ensurePagination(
    payload?.meta?.pagination ?? undefined,
    {
      page: options.page,
      pageSize: options.pageSize,
      total: payload?.meta?.pagination?.total ?? comments.length,
    },
  );

  return { comments, pagination };
}

export function normalizeSingleComment(
  payload: Nullable<StrapiSingleCommentResponse | StrapiCommentEntity>,
): NormalizedSingleComment {
  const entity =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as StrapiSingleCommentResponse).data
      : (payload as StrapiCommentEntity | null | undefined);

  const normalized = normalizeStrapiComment(entity);

  if (!normalized) {
    throw new Error('Strapi no devolvió un comentario válido.');
  }

  const articleDocumentId = extractArticleDocumentIdFromRelation(
    (entity?.attributes as StrapiCommentAttributes | undefined)?.article,
  );

  return {
    comment: normalized,
    articleDocumentId,
  };
}
