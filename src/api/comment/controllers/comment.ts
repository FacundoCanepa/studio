// src/api/comment/controllers/comment.ts
'use strict';

import { factories } from '@strapi/strapi';

const COMMENT_UID = 'api::comment.comment';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const FALLBACK_DISPLAY_NAME = 'Usuario';

type UnknownRecord = Record<string, any>;

type Maybe<T> = T | null | undefined;

const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const ensureQueryDefaults = (query: UnknownRecord | undefined | null): void => {
  if (!query || typeof query !== 'object') {
    return;
  }

  const hasSort = Object.prototype.hasOwnProperty.call(query, 'sort');
  const sortValue = hasSort ? (query as UnknownRecord).sort : undefined;

  if (
    !hasSort ||
    sortValue === undefined ||
    sortValue === null ||
    (typeof sortValue === 'string' && sortValue.trim().length === 0) ||
    (Array.isArray(sortValue) && sortValue.length === 0)
  ) {
    (query as UnknownRecord).sort = 'createdAt:desc';
  }

  const paginationSource: UnknownRecord =
    query.pagination && typeof query.pagination === 'object'
      ? { ...query.pagination }
      : {};

  const resolvedPage =
    parsePositiveInteger(paginationSource.page) ??
    parsePositiveInteger(paginationSource.pageNumber) ??
    parsePositiveInteger((query as UnknownRecord).page) ??
    DEFAULT_PAGE;

  const resolvedPageSize =
    parsePositiveInteger(paginationSource.pageSize) ??
    parsePositiveInteger(paginationSource.limit) ??
    parsePositiveInteger((query as UnknownRecord).pageSize) ??
    DEFAULT_PAGE_SIZE;

  paginationSource.page = resolvedPage;
  paginationSource.pageSize = resolvedPageSize;

  if (Object.prototype.hasOwnProperty.call(paginationSource, 'limit')) {
    delete paginationSource.limit;
  }

  if (Object.prototype.hasOwnProperty.call(paginationSource, 'pageNumber')) {
    delete paginationSource.pageNumber;
  }

  (query as UnknownRecord).pagination = paginationSource;
};

const extractRelationId = (rel: unknown): string | number | null => {
  if (rel === null || rel === undefined) {
    return null;
  }

  if (typeof rel === 'number' || typeof rel === 'string') {
    return rel;
  }

  if (Array.isArray(rel)) {
    for (const item of rel) {
      const resolved = extractRelationId(item);
      if (resolved !== null && resolved !== undefined) {
        return resolved;
      }
    }
    return null;
  }

  if (typeof rel === 'object') {
    const record = rel as UnknownRecord;

    if (
      Object.prototype.hasOwnProperty.call(record, 'id') &&
      (typeof record.id === 'number' || typeof record.id === 'string')
    ) {
      return record.id;
    }

    if (
      Object.prototype.hasOwnProperty.call(record, 'documentId') &&
      typeof record.documentId === 'string'
    ) {
      return record.documentId;
    }

    if (Object.prototype.hasOwnProperty.call(record, 'connect')) {
      return extractRelationId(record.connect);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'data')) {
      return extractRelationId(record.data);
    }
  }

  return null;
};

const normalizeEstadoValue = (strapi: any, value: unknown): string | undefined | null => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const schema = strapi.contentType(COMMENT_UID);
  const enumValues: Maybe<string[]> =
    schema &&
    schema.attributes &&
    schema.attributes.estado &&
    Array.isArray(schema.attributes.estado.enum)
      ? schema.attributes.estado.enum
      : null;

  if (enumValues && !enumValues.includes(trimmed)) {
    return null;
  }

  return trimmed;
};

const sanitizeDisplayName = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractDisplayNameFromUser = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const extracted = extractDisplayNameFromUser(item);
      if (extracted) {
        return extracted;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    const record = value as UnknownRecord;
    const candidates: (keyof UnknownRecord)[] = ['displayName', 'name', 'username'];

    for (const field of candidates) {
      if (Object.prototype.hasOwnProperty.call(record, field)) {
        const candidate = sanitizeDisplayName(record[field]);
        if (candidate) {
          return candidate;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(record, 'attributes')) {
      const extracted = extractDisplayNameFromUser(record.attributes);
      if (extracted) {
        return extracted;
      }
    }

    if (Object.prototype.hasOwnProperty.call(record, 'data')) {
      return extractDisplayNameFromUser(record.data);
    }
  }

  return null;
};

const mapAuthorFields = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => mapAuthorFields(item));
  }

  if (value && typeof value === 'object') {
    const record = value as UnknownRecord;
    const transformedEntries: UnknownRecord = {};
    const hasAuthorSnapshot =
      Object.prototype.hasOwnProperty.call(record, 'author_displayName') ||
      Object.prototype.hasOwnProperty.call(record, 'users_permissions_user') ||
      Object.prototype.hasOwnProperty.call(record, 'author');

    for (const [key, nestedValue] of Object.entries(record)) {
      if (key === 'author_displayName' || key === 'users_permissions_user' || key === 'author') {
        continue;
      }

      transformedEntries[key] = mapAuthorFields(nestedValue);
    }

    if (hasAuthorSnapshot) {
      const snapshot = sanitizeDisplayName(record.author_displayName);
      const fallback = extractDisplayNameFromUser(record.users_permissions_user);
      transformedEntries.author = {
        displayName: snapshot || fallback || FALLBACK_DISPLAY_NAME,
      };
    }

    return transformedEntries;
  }

  return value;
};

const transformControllerResponse = <T>(response: T): T => {
  if (!response || typeof response !== 'object') {
    return response;
  }

  if (Array.isArray(response)) {
    return response.map((item) => mapAuthorFields(item)) as T;
  }

  if (Object.prototype.hasOwnProperty.call(response as UnknownRecord, 'data')) {
    const mutableResponse = response as UnknownRecord;
    const data = mutableResponse.data;

    if (Array.isArray(data)) {
      mutableResponse.data = data.map((item) => mapAuthorFields(item));
    } else {
      mutableResponse.data = mapAuthorFields(data);
    }

    return response;
  }

  return mapAuthorFields(response);
};

const resolveUserId = (value: unknown): string | number | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = resolveUserId(item);
      if (resolved !== null && resolved !== undefined) {
        return resolved;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    const record = value as UnknownRecord;

    if (Object.prototype.hasOwnProperty.call(record, 'id')) {
      return record.id as string | number | null;
    }

    if (Object.prototype.hasOwnProperty.call(record, 'data')) {
      return resolveUserId(record.data);
    }
  }

  return null;
};

const resolveUserDisplayName = (user: unknown): string => {
  if (!user || typeof user !== 'object') {
    return FALLBACK_DISPLAY_NAME;
  }

  const record = user as UnknownRecord;
  const candidates: (keyof UnknownRecord)[] = ['displayName', 'name', 'username'];

  for (const field of candidates) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      const candidate = sanitizeDisplayName(record[field]);
      if (candidate) {
        return candidate;
      }
    }
  }

  return FALLBACK_DISPLAY_NAME;
};

export default factories.createCoreController(COMMENT_UID, ({ strapi }) => ({
  async find(ctx: any) {
    ctx.query = ctx.query || {};
    ensureQueryDefaults(ctx.query);

    const response = await super.find(ctx);
    return transformControllerResponse(response);
  },

  async findOne(ctx: any) {
    const response = await super.findOne(ctx);
    return transformControllerResponse(response);
  },

  async create(ctx: any) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to create a comment.');
    }

    const body = ctx.request.body || {};
    const data = body.data || {};

    const rawContent = data.content;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    if (content.length === 0) {
      return ctx.badRequest('Comment content is required.');
    }

    if (!Object.prototype.hasOwnProperty.call(data, 'article')) {
      return ctx.badRequest('Article is required.');
    }

    const articleId = extractRelationId(data.article);
    if (articleId === null || articleId === undefined) {
      return ctx.badRequest('Article is required.');
    }

    let normalizedEstado: string | undefined | null;
    if (Object.prototype.hasOwnProperty.call(data, 'estado')) {
      normalizedEstado = normalizeEstadoValue(strapi, data.estado);
      if (normalizedEstado === null) {
        return ctx.badRequest('Invalid estado value.');
      }
    }

    const sanitizedData: UnknownRecord = { ...data };
    delete sanitizedData.author;
    delete sanitizedData.users_permissions_user;
    delete sanitizedData.author_displayName;

    sanitizedData.content = content;
    sanitizedData.users_permissions_user = user.id;
    sanitizedData.author_displayName = resolveUserDisplayName(user);

    if (normalizedEstado !== undefined) {
      sanitizedData.estado = normalizedEstado;
    }

    ctx.request.body = { ...body, data: sanitizedData };

    const response = await super.create(ctx);
    return transformControllerResponse(response);
  },

  async update(ctx: any) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to update a comment.');
    }

    const { id } = ctx.params;
    const existingComment = await strapi.entityService.findOne(COMMENT_UID, id, {
      populate: { users_permissions_user: true },
    });

    if (!existingComment) {
      return ctx.notFound('Comment not found.');
    }

    const ownerId = resolveUserId(existingComment.users_permissions_user);
    if (ownerId === null || String(ownerId) !== String(user.id)) {
      return ctx.forbidden('You are not allowed to update this comment.');
    }

    const body = ctx.request.body || {};
    const data = body.data || {};
    const allowedFields = new Set(['content', 'estado']);

    const unexpectedFields = Object.keys(data).filter((key) => !allowedFields.has(key));
    if (unexpectedFields.length > 0) {
      return ctx.badRequest('Only the comment content or status can be updated.');
    }

    if (!Object.prototype.hasOwnProperty.call(data, 'content')) {
      return ctx.badRequest('Comment content is required.');
    }

    const rawContent = data.content;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    if (content.length === 0) {
      return ctx.badRequest('Comment content cannot be empty.');
    }

    let normalizedEstado: string | undefined | null;
    if (Object.prototype.hasOwnProperty.call(data, 'estado')) {
      normalizedEstado = normalizeEstadoValue(strapi, data.estado);
      if (normalizedEstado === null) {
        return ctx.badRequest('Invalid estado value.');
      }
    }

    const sanitizedData: UnknownRecord = { content };
    if (normalizedEstado !== undefined) {
      sanitizedData.estado = normalizedEstado;
    }

    ctx.request.body = { ...body, data: sanitizedData };

    const response = await super.update(ctx);
    return transformControllerResponse(response);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to delete a comment.');
    }

    const { id } = ctx.params;
    const existingComment = await strapi.entityService.findOne(COMMENT_UID, id, {
      populate: { users_permissions_user: true },
    });

    if (!existingComment) {
      return ctx.notFound('Comment not found.');
    }

    const ownerId = resolveUserId(existingComment.users_permissions_user);
    if (ownerId === null || String(ownerId) !== String(user.id)) {
      return ctx.forbidden('You are not allowed to delete this comment.');
    }

    const response = await super.delete(ctx);
    return transformControllerResponse(response);
  },
}));