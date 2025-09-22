import { qs } from '@/lib/qs';

export const COMMENTS_REVALIDATE_SECONDS = 60;
export const COMMENTS_TAG = 'comments';

export function buildCommentsTag(documentId: string): string {
  return `${COMMENTS_TAG}:${documentId}`;
}

const COMMENT_FIELDS = ['content', 'estado', 'createdAt', 'updatedAt', 'author_displayName'];
const USER_FIELDS = ['id']; // Sólo necesitamos el id para ownership; el nombre proviene del snapshot.
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
      users_permissions_user: {
        fields: USER_FIELDS,
      },
      parent: { fields: ['id'] },
      children: {
        fields: COMMENT_FIELDS,
        sort: ['createdAt:asc'],
        populate: {
          users_permissions_user: { fields: USER_FIELDS },
          parent: { fields: ['id'] },
          children: {
            fields: COMMENT_FIELDS,
            sort: ['createdAt:asc'],
            populate: {
              users_permissions_user: { fields: USER_FIELDS },
              parent: { fields: ['id'] },
            },
          },
        },
      },
      article: { fields: ARTICLE_FIELDS },
    },
  });
}


type Nullable<T> = T | null | undefined;

interface StrapiRelation<TAttributes = Record<string, unknown>> {
  data?: { id?: number | string | null; attributes?: Nullable<TAttributes>; } | null;
  id?: number | string | null;
  attributes?: Nullable<TAttributes>;
  [key: string]: unknown;
}

interface StrapiUserAttributes {
  username?: string | null;
  name?: string | null;
  displayName?: string | null;
}

interface StrapiCommentAttributes {
  content?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  estado?: string | null;
  author_displayName?: string | null; // Snapshot field
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
  meta?: { pagination?: Nullable<CommentsPagination> };
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
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function resolveAuthor(attributes: StrapiCommentAttributes): CommentAuthorDto {
  const fallbackName = 'Usuario';
  const authorRelation = attributes.users_permissions_user;
  
  const relationId = authorRelation?.data?.id ?? authorRelation?.id;

  // El nombre visible siempre proviene del snapshot plano; si falta usamos el fallback.
  const displayName = isNonEmptyString(attributes.author_displayName)
    ? attributes.author_displayName
    : fallbackName;

  return { id: toNumberId(relationId), displayName };
}

function normalizeStrapiComment(entity: Nullable<StrapiCommentEntity>): CommentDto | null {
  if (!entity || typeof entity !== 'object') return null;

  const id = toNumberId(entity.id);
  const attributes = (entity.attributes ?? {}) as StrapiCommentAttributes;
  if (id === null && !attributes) return null;

  const createdAt = attributes?.createdAt ?? new Date().toISOString();
  
  const children = Array.isArray(attributes?.children?.data) 
    ? attributes.children.data.map(normalizeStrapiComment).filter((c): c is CommentDto => c !== null)
    : [];

  return {
    id: id ?? 0,
    content: attributes?.content ?? '',
    createdAt: createdAt,
    updatedAt: attributes?.updatedAt ?? createdAt,
    estado: attributes?.estado ?? null,
    parentId: toNumberId(attributes?.parent?.data?.id ?? attributes?.parent?.id),
    author: resolveAuthor(attributes),
    children: children,
  };
}

export function normalizeCommentsResponse(
  payload: Nullable<StrapiCommentsResponse>,
  options: { page: number; pageSize: number },
): NormalizedCommentsResponse {
  const rawData = payload?.data ?? [];
  const comments = Array.isArray(rawData)
    ? rawData.map(normalizeStrapiComment).filter((c): c is CommentDto => c !== null)
    : [];

  const pagination = {
    page: payload?.meta?.pagination?.page ?? options.page,
    pageSize: payload?.meta?.pagination?.pageSize ?? options.pageSize,
    pageCount: payload?.meta?.pagination?.pageCount ?? Math.max(1, Math.ceil(comments.length / options.pageSize)),
    total: payload?.meta?.pagination?.total ?? comments.length,
  };

  return { comments, pagination };
}

export function normalizeSingleComment(
  payload: Nullable<StrapiSingleCommentResponse | StrapiCommentEntity>,
): NormalizedSingleComment {
  const entity = payload && 'data' in payload ? (payload as StrapiSingleCommentResponse).data : (payload as Nullable<StrapiCommentEntity>);
  const normalized = normalizeStrapiComment(entity);
  if (!normalized) throw new Error('Strapi no devolvió un comentario válido.');
  
  const articleRelation = (entity?.attributes as Nullable<StrapiCommentAttributes>)?.article;
  const articleData = articleRelation?.data || articleRelation;
  const articleAttrs = (articleData as any)?.attributes || articleData;
  const articleDocumentId = articleAttrs?.documentId || null;

  return { comment: normalized, articleDocumentId };
}
