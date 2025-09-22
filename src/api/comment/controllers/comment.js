'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const COMMENT_UID = 'api::comment.comment';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const FALLBACK_DISPLAY_NAME = 'Usuario';

const parsePositiveInteger = (value) => {
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

const ensureQueryDefaults = (query) => {
  if (!query || typeof query !== 'object') {
    return;
  }

  const hasSort = Object.prototype.hasOwnProperty.call(query, 'sort');
  const sortValue = hasSort ? query.sort : undefined;

  if (
    !hasSort ||
    sortValue === undefined ||
    sortValue === null ||
    (typeof sortValue === 'string' && sortValue.trim().length === 0) ||
    (Array.isArray(sortValue) && sortValue.length === 0)
  ) {
    query.sort = 'createdAt:desc';
  }

  const paginationSource =
    query.pagination && typeof query.pagination === 'object'
      ? { ...query.pagination }
      : {};

  const resolvedPage =
    parsePositiveInteger(paginationSource.page) ??
    parsePositiveInteger(paginationSource.pageNumber) ??
    parsePositiveInteger(query.page) ??
    DEFAULT_PAGE;

  const resolvedPageSize =
    parsePositiveInteger(paginationSource.pageSize) ??
    parsePositiveInteger(paginationSource.limit) ??
    parsePositiveInteger(query.pageSize) ??
    DEFAULT_PAGE_SIZE;

  paginationSource.page = resolvedPage;
  paginationSource.pageSize = resolvedPageSize;

  if (Object.prototype.hasOwnProperty.call(paginationSource, 'limit')) {
    delete paginationSource.limit;
  }
  if (Object.prototype.hasOwnProperty.call(paginationSource, 'pageNumber')) {
    delete paginationSource.pageNumber;
  }

  query.pagination = paginationSource;
};

const extractRelationId = (rel) => {
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
    if (
      Object.prototype.hasOwnProperty.call(rel, 'id') &&
      (typeof rel.id === 'number' || typeof rel.id === 'string')
    ) {
      return rel.id;
    }

    if (
      Object.prototype.hasOwnProperty.call(rel, 'documentId') &&
      typeof rel.documentId === 'string'
    ) {
      return rel.documentId;
    }

    if (Object.prototype.hasOwnProperty.call(rel, 'connect')) {
      return extractRelationId(rel.connect);
    }

    if (Object.prototype.hasOwnProperty.call(rel, 'data')) {
      return extractRelationId(rel.data);
    }
  }

  return null;
};

const normalizeEstadoValue = (strapi, value) => {
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
  const enumValues =
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

const sanitizeDisplayName = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractDisplayNameFromUser = (value) => {
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
    const candidates = ['displayName', 'name', 'username'];
    for (const field of candidates) {
      if (Object.prototype.hasOwnProperty.call(value, field)) {
        const candidate = sanitizeDisplayName(value[field]);
        if (candidate) {
          return candidate;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(value, 'attributes')) {
      const extracted = extractDisplayNameFromUser(value.attributes);
      if (extracted) {
        return extracted;
      }
    }

    if (Object.prototype.hasOwnProperty.call(value, 'data')) {
      return extractDisplayNameFromUser(value.data);
    }
  }

  return null;
};

const mapAuthorFields = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => mapAuthorFields(item));
  }

  if (value && typeof value === 'object') {
    const transformedEntries = {};
    const hasAuthorSnapshot =
      Object.prototype.hasOwnProperty.call(value, 'author_displayName') ||
      Object.prototype.hasOwnProperty.call(value, 'users_permissions_user') ||
      Object.prototype.hasOwnProperty.call(value, 'author');

    for (const [key, nestedValue] of Object.entries(value)) {
      if (
        key === 'author_displayName' ||
        key === 'users_permissions_user' ||
        key === 'author'
      ) {
        continue;
      }

      transformedEntries[key] = mapAuthorFields(nestedValue);
    }

    if (hasAuthorSnapshot) {
      const snapshot = sanitizeDisplayName(value.author_displayName);
      const fallback = extractDisplayNameFromUser(value.users_permissions_user);
      transformedEntries.author = {
        displayName: snapshot || fallback || FALLBACK_DISPLAY_NAME,
      };
    }

    return transformedEntries;
  }

  return value;
};

const transformControllerResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return response;
  }

  if (Array.isArray(response)) {
    return response.map((item) => mapAuthorFields(item));
  }

  if (Object.prototype.hasOwnProperty.call(response, 'data')) {
    const data = response.data;
    if (Array.isArray(data)) {
      response.data = data.map((item) => mapAuthorFields(item));
    } else {
      response.data = mapAuthorFields(data);
    }
  } else {
    return mapAuthorFields(response);
  }

  return response;
};

const resolveUserId = (value) => {
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
    if (Object.prototype.hasOwnProperty.call(value, 'id')) {
      return value.id;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'data')) {
      return resolveUserId(value.data);
    }
  }

  return null;
};

const resolveUserDisplayName = (user) => {
  if (!user || typeof user !== 'object') {
    return FALLBACK_DISPLAY_NAME;
  }

  const candidates = ['displayName', 'name', 'username'];
  for (const field of candidates) {
    if (Object.prototype.hasOwnProperty.call(user, field)) {
      const candidate = sanitizeDisplayName(user[field]);
      if (candidate) {
        return candidate;
      }
    }
  }

  return FALLBACK_DISPLAY_NAME;
};

module.exports = createCoreController(COMMENT_UID, ({ strapi }) => ({
  async find(ctx) {
    ctx.query = ctx.query || {};
    ensureQueryDefaults(ctx.query);

    const response = await super.find(ctx);
    return transformControllerResponse(response);
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    return transformControllerResponse(response);
  },

  async create(ctx) {
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

    let normalizedEstado;
    if (Object.prototype.hasOwnProperty.call(data, 'estado')) {
      normalizedEstado = normalizeEstadoValue(strapi, data.estado);
      if (normalizedEstado === null) {
        return ctx.badRequest('Invalid estado value.');
      }
    }

    const sanitizedData = { ...data };
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

  async update(ctx) {
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

    let normalizedEstado;
    if (Object.prototype.hasOwnProperty.call(data, 'estado')) {
      normalizedEstado = normalizeEstadoValue(strapi, data.estado);
      if (normalizedEstado === null) {
        return ctx.badRequest('Invalid estado value.');
      }
    }

    const sanitizedData = { content };
    if (normalizedEstado !== undefined) {
      sanitizedData.estado = normalizedEstado;
    }

    ctx.request.body = { ...body, data: sanitizedData };

    const response = await super.update(ctx);
    return transformControllerResponse(response);
  },

  async delete(ctx) {
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