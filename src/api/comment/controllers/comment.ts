'use strict';

import { factories } from '@strapi/strapi';

const COMMENT_UID = 'api::comment.comment';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const FALLBACK_DISPLAY_NAME = 'Usuario';
const MIGRATION_BATCH_SIZE = 100;

export type UnknownRecord = Record<string, any>;
type Maybe<T> = T | null | undefined;

export interface CommentMetricsCounts {
  GET: number;
  POST: number;
  PUT: number;
  DELETE: number;
}

export interface CommentMetricsStore {
  increment(method: keyof CommentMetricsCounts): void;
  snapshot(): CommentMetricsCounts;
  reset(): void;
}

export interface CommentControllerLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/* ------------------------------------------------------------
 * Logger & Métricas
 * ------------------------------------------------------------ */
const createDefaultLogger = (): CommentControllerLogger => ({
  info(message, meta) {
    if (meta) {
      console.log(`[COMMENT_CONTROLLER][INFO] ${message}`, meta);
    } else {
      console.log(`[COMMENT_CONTROLLER][INFO] ${message}`);
    }
  },
  warn(message, meta) {
    if (meta) {
      console.warn(`[COMMENT_CONTROLLER][WARN] ${message}`, meta);
    } else {
      console.warn(`[COMMENT_CONTROLLER][WARN] ${message}`);
    }
  },
  error(message, meta) {
    if (meta) {
      console.error(`[COMMENT_CONTROLLER][ERROR] ${message}`, meta);
    } else {
      console.error(`[COMMENT_CONTROLLER][ERROR] ${message}`);
    }
  },
});

const defaultLogger = createDefaultLogger();

export const createInMemoryCommentMetrics = (): CommentMetricsStore => {
  const counters: CommentMetricsCounts = { GET: 0, POST: 0, PUT: 0, DELETE: 0 };
  return {
    increment(method) {
      counters[method] += 1;
    },
    snapshot() {
      return { ...counters };
    },
    reset() {
      counters.GET = 0;
      counters.POST = 0;
      counters.PUT = 0;
      counters.DELETE = 0;
    },
  };
};

const globalMetricsStore = createInMemoryCommentMetrics();
let migrationPromise: Promise<void> | null = null;
let migrationCompleted = false;

export const getCommentMetricsSnapshot = () => globalMetricsStore.snapshot();

export function resetCommentControllerStateForTests() {
  globalMetricsStore.reset();
  migrationPromise = null;
  migrationCompleted = false;
}

/* ------------------------------------------------------------
 * Utils
 * ------------------------------------------------------------ */
const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const ensureQueryDefaults = (query: UnknownRecord | undefined | null): void => {
  if (!query || typeof query !== 'object') return;

  if (!Object.prototype.hasOwnProperty.call(query, 'sort')) {
    (query as UnknownRecord).sort = { createdAt: 'desc' };
  }

  const page = parsePositiveInteger((query as UnknownRecord)?.page) ?? DEFAULT_PAGE;
  const pageSize =
    parsePositiveInteger((query as UnknownRecord)?.pageSize) ?? DEFAULT_PAGE_SIZE;

  (query as UnknownRecord).page = page;
  (query as UnknownRecord).pageSize = pageSize;

  if (!Object.prototype.hasOwnProperty.call(query, 'populate')) {
    (query as UnknownRecord).populate = { users_permissions_user: true };
  }
};

const extractRelationId = (rel: unknown): string | number | null => {
  if (rel == null) return null;
  if (typeof rel === 'number' || typeof rel === 'string') return rel;
  if (Array.isArray(rel)) {
    for (const item of rel) {
      const id = extractRelationId(item);
      if (id != null) return id;
    }
    return null;
  }
  if (typeof rel === 'object') {
    const record = rel as UnknownRecord;
    if (Object.prototype.hasOwnProperty.call(record, 'id') && (typeof record.id === 'number' || typeof record.id === 'string')) {
      return record.id;
    }
    if (Object.prototype.hasOwnProperty.call(record, 'documentId') && typeof record.documentId === 'string') {
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

const extractEntityId = (value: unknown): string | number | null => {
  if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value as UnknownRecord, 'data')) {
    return extractEntityId((value as UnknownRecord).data);
  }
  return extractRelationId(value);
};

const sanitizeDisplayName = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractDisplayNameFromUser = (input: unknown): string | null => {
  if (!input || typeof input !== 'object') return null;
  const rec = input as UnknownRecord;
  for (const key of ['displayName', 'name', 'username', 'email']) {
    if (Object.prototype.hasOwnProperty.call(rec, key)) {
      const val = sanitizeDisplayName(rec[key]);
      if (val) return val;
    }
  }
  if (Object.prototype.hasOwnProperty.call(rec, 'attributes')) {
    const inner = extractDisplayNameFromUser(rec.attributes);
    if (inner) return inner;
  }
  if (Object.prototype.hasOwnProperty.call(rec, 'data')) {
    const inner = extractDisplayNameFromUser(rec.data);
    if (inner) return inner;
  }
  return null;
};

const resolveUserDisplayName = (user: unknown): string => {
  const fromUser = extractDisplayNameFromUser(user);
  return fromUser ?? FALLBACK_DISPLAY_NAME;
};

const ensureLogger = (logger?: Partial<CommentControllerLogger>): CommentControllerLogger => ({
  info: logger?.info ? logger.info.bind(logger) : defaultLogger.info.bind(defaultLogger),
  warn: logger?.warn ? logger.warn.bind(logger) : defaultLogger.warn.bind(defaultLogger),
  error: logger?.error ? logger.error.bind(logger) : defaultLogger.error.bind(defaultLogger),
});

const resolveArticleIdFromComment = (value: unknown): string | number | null => {
  if (!value || typeof value !== 'object') return extractRelationId(value);
  const record = value as UnknownRecord;
  if (Object.prototype.hasOwnProperty.call(record, 'article')) return extractRelationId(record.article);
  if (Object.prototype.hasOwnProperty.call(record, 'attributes')) return resolveArticleIdFromComment(record.attributes);
  return extractRelationId(record);
};

const normalizeEstadoValue = (strapi: any, value: unknown): string | undefined | null => {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const schema = strapi.contentType(COMMENT_UID);
  const enumValues: Maybe<string[]> = schema?.attributes?.estado?.enum ?? null;
  if (enumValues && !enumValues.includes(trimmed)) return null;
  return trimmed;
};

const mapAuthorFields = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((v) => mapAuthorFields(v));
  if (!value || typeof value !== 'object') return value;

  const record = { ...(value as UnknownRecord) };
  let authorSnapshot = sanitizeDisplayName(record.author_displayName);

  if (!authorSnapshot && Object.prototype.hasOwnProperty.call(record, 'users_permissions_user')) {
    authorSnapshot = extractDisplayNameFromUser(record.users_permissions_user);
  }

  delete record.users_permissions_user;
  record.author = { displayName: authorSnapshot || FALLBACK_DISPLAY_NAME };

  for (const key of Object.keys(record)) {
    if (typeof record[key] === 'object' && record[key] !== null) {
      record[key] = mapAuthorFields(record[key]);
    }
  }

  return record;
};

const transformControllerResponse = <T>(response: T): T => {
  if (!response || typeof response !== 'object') return response;

  const performTransform = (data: any) => {
    if (Array.isArray(data)) return data.map(mapAuthorFields);
    return mapAuthorFields(data);
  };
  
  if (Object.prototype.hasOwnProperty.call(response as UnknownRecord, 'data')) {
    const mutable = response as UnknownRecord;
    mutable.data = performTransform(mutable.data);
    return mutable as T;
  }

  return performTransform(response) as T;
};

const resolveUserId = (value: unknown): string | number | null => {
  if (!value) return null;
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = resolveUserId(item);
      if (resolved != null) return resolved;
    }
    return null;
  }
  if (typeof value === 'object') {
    const record = value as UnknownRecord;
    if (Object.prototype.hasOwnProperty.call(record, 'id') && (typeof record.id === 'number' || typeof record.id === 'string')) {
      return record.id;
    }
    if (Object.prototype.hasOwnProperty.call(record, 'data')) {
      return resolveUserId(record.data);
    }
  }
  return null;
};

const runAuthorDisplayNameBackfill = async (strapi: any, logger: CommentControllerLogger) => {
  if (!strapi?.entityService?.findMany || !strapi?.entityService?.update) return;

  let processed = 0;
  while (true) {
    const missingComments = await strapi.entityService.findMany(COMMENT_UID, {
      filters: { author_displayName: { $null: true } },
      populate: { users_permissions_user: true },
      limit: MIGRATION_BATCH_SIZE,
    });

    if (!Array.isArray(missingComments) || missingComments.length === 0) break;

    for (const comment of missingComments) {
      const commentId = extractRelationId((comment as any)?.id ?? comment);
      if (commentId == null) {
        logger.warn('[COMMENT_MIGRATION_SKIP]', { reason: 'missing_comment_id' });
        continue;
      }
      const userRelation = (comment as UnknownRecord)?.users_permissions_user ?? null;
      const derivedName = extractDisplayNameFromUser(userRelation) ?? resolveUserDisplayName(userRelation);
      try {
        await strapi.entityService.update(COMMENT_UID, commentId, {
          data: { author_displayName: derivedName || FALLBACK_DISPLAY_NAME },
        });
        processed += 1;
      } catch (error) {
        logger.error('[COMMENT_MIGRATION_ERROR]', { commentId, error: (error as Error)?.message ?? String(error) });
      }
    }
  }
  if (processed > 0) logger.info('[COMMENT_MIGRATION_SUCCESS]', { processed });
};

const ensureAuthorSnapshotBackfill = async (strapi: any, logger: CommentControllerLogger) => {
  if (migrationCompleted) return;
  if (!migrationPromise) {
    migrationPromise = runAuthorDisplayNameBackfill(strapi, logger)
      .then(() => { migrationCompleted = true; })
      .catch((error) => { logger.error('[COMMENT_MIGRATION_FAILURE]', { error: (error as Error)?.message ?? String(error) }); })
      .finally(() => { migrationPromise = null; });
  }
  try {
    await migrationPromise;
  } catch { /* ya logueado */ }
};

export default factories.createCoreController(COMMENT_UID, ({ strapi }) => {
  const metrics = globalMetricsStore;
  const logger = defaultLogger;
  const resolvedLogger = ensureLogger(logger);

  return {
    async find(ctx: any) {
      metrics.increment('GET');
      await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
      ctx.query = ctx.query || {};
      ensureQueryDefaults(ctx.query);
      const response = await (super as any).find(ctx);
      return transformControllerResponse(response);
    },

    async findOne(ctx: any) {
      metrics.increment('GET');
      await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
      const response = await (super as any).findOne(ctx);
      return transformControllerResponse(response);
    },

    async create(ctx: any) {
      metrics.increment('POST');
      await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('You must be logged in to create a comment.');
      const body = ctx.request.body || {};
      const data = body.data || {};
      const content = typeof data.content === 'string' ? data.content.trim() : '';
      if (content.length === 0) return ctx.badRequest('Comment content is required.');
      if (!Object.prototype.hasOwnProperty.call(data, 'article')) return ctx.badRequest('Article is required.');
      const articleId = extractRelationId(data.article);
      if (articleId == null) return ctx.badRequest('Article is required.');
      const sanitizedData: UnknownRecord = { ...data };
      delete sanitizedData.author;
      delete sanitizedData.users_permissions_user;
      delete sanitizedData.author_displayName;
      sanitizedData.content = content;
      sanitizedData.users_permissions_user = user.id;
      sanitizedData.author_displayName = resolveUserDisplayName(user);
      if (Object.prototype.hasOwnProperty.call(data, 'estado')) {
        const normalizedEstado = normalizeEstadoValue(strapi, data.estado);
        if (normalizedEstado === null) return ctx.badRequest('Invalid estado value.');
        sanitizedData.estado = normalizedEstado;
      }
      ctx.request.body = { ...body, data: sanitizedData };
      const response = await (super as any).create(ctx);
      const commentId = extractEntityId(response);
      resolvedLogger.info('[COMMENT_CREATE]', { commentId, userId: user.id, articleId });
      return transformControllerResponse(response);
    },

    async update(ctx: any) {
      metrics.increment('PUT');
      await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('You must be logged in to update a comment.');
      const { id } = ctx.params;
      const existingComment = await strapi.entityService.findOne(COMMENT_UID, id, { populate: { users_permissions_user: true } });
      if (!existingComment) return ctx.notFound('Comment not found.');
      const ownerId = resolveUserId((existingComment as any).users_permissions_user);
      if (ownerId === null || String(ownerId) !== String(user.id)) return ctx.forbidden('You are not allowed to update this comment.');
      const body = ctx.request.body || {};
      const data = body.data || {};
      const unexpectedFields = Object.keys(data).filter(key => !['content', 'estado'].includes(key));
      if (unexpectedFields.length > 0) return ctx.badRequest('Only content or status can be updated.');
      if (!Object.prototype.hasOwnProperty.call(data, 'content')) return ctx.badRequest('Comment content is required.');
      const content = typeof data.content === 'string' ? data.content.trim() : '';
      if (content.length === 0) return ctx.badRequest('Comment content cannot be empty.');
      const sanitizedData: UnknownRecord = { content };
      if (Object.prototype.hasOwnProperty.call(data, 'estado')) {
        const normalizedEstado = normalizeEstadoValue(strapi, data.estado);
        if (normalizedEstado === null) return ctx.badRequest('Invalid estado value.');
        sanitizedData.estado = normalizedEstado;
      }
      ctx.request.body = { ...body, data: sanitizedData };
      const response = await (super as any).update(ctx);
      return transformControllerResponse(response);
    },

    async delete(ctx: any) {
      metrics.increment('DELETE');
      await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('You must be logged in to delete a comment.');
      const { id } = ctx.params;
      const existingComment = await strapi.entityService.findOne(COMMENT_UID, id, { populate: { users_permissions_user: true } });
      if (!existingComment) return ctx.notFound('Comment not found.');
      const ownerId = resolveUserId((existingComment as any).users_permissions_user);
      if (ownerId === null || String(ownerId) !== String(user.id)) return ctx.forbidden('You are not allowed to delete this comment.');
      const response = await (super as any).delete(ctx);
      return transformControllerResponse(response);
    },
    
    async findByArticle(ctx: any) {
        metrics.increment('GET');
        await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);

        const documentId = ctx.params.id || ctx.params.documentId;
        if (!documentId) return ctx.badRequest('Article ID or Document ID is required.');

        const page = parsePositiveInteger(ctx.query.page) ?? DEFAULT_PAGE;
        const pageSize = parsePositiveInteger(ctx.query.pageSize) ?? DEFAULT_PAGE_SIZE;

        const results = await strapi.entityService.findPage(COMMENT_UID, {
            ...ctx.query,
            page,
            pageSize,
            filters: {
                ...ctx.query.filters,
                article: { documentId: { $eq: documentId } },
                estado: { $eq: 'approved' },
            },
            populate: {
                users_permissions_user: {
                    fields: ['username', 'name', 'displayName']
                },
                children: {
                    populate: {
                        users_permissions_user: {
                           fields: ['username', 'name', 'displayName']
                        }
                    }
                }
            },
        });
        
        return transformControllerResponse(results);
    },

  };
});
