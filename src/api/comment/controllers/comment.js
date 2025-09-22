'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentControllerHandlers = exports.getCommentMetricsSnapshot = exports.createInMemoryCommentMetrics = void 0;
exports.resetCommentControllerStateForTests = resetCommentControllerStateForTests;
const strapi_1 = require("@strapi/strapi");
const COMMENT_UID = 'api::comment.comment';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const FALLBACK_DISPLAY_NAME = 'Usuario';
const MIGRATION_BATCH_SIZE = 100;
const createDefaultLogger = () => ({
    info(message, meta) {
        if (meta) {
            console.log(message, meta);
        }
        else {
            console.log(message);
        }
    },
    warn(message, meta) {
        if (meta) {
            console.warn(message, meta);
        }
        else {
            console.warn(message);
        }
    },
    error(message, meta) {
        if (meta) {
            console.error(message, meta);
        }
        else {
            console.error(message);
        }
    },
});
const defaultLogger = createDefaultLogger();
const createInMemoryCommentMetrics = () => {
    const counters = { GET: 0, POST: 0, PUT: 0, DELETE: 0 };
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
exports.createInMemoryCommentMetrics = createInMemoryCommentMetrics;
const globalMetricsStore = (0, exports.createInMemoryCommentMetrics)();
let migrationPromise = null;
let migrationCompleted = false;
const getCommentMetricsSnapshot = () => globalMetricsStore.snapshot();
exports.getCommentMetricsSnapshot = getCommentMetricsSnapshot;
function resetCommentControllerStateForTests() {
    globalMetricsStore.reset();
    migrationPromise = null;
    migrationCompleted = false;
}
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
    var _a, _b, _c, _d, _e, _f;
    if (!query || typeof query !== 'object') {
        return;
    }
    const hasSort = Object.prototype.hasOwnProperty.call(query, 'sort');
    const sortValue = hasSort ? query.sort : undefined;
    if (!hasSort ||
        sortValue === undefined ||
        sortValue === null ||
        (typeof sortValue === 'string' && sortValue.trim().length === 0) ||
        (Array.isArray(sortValue) && sortValue.length === 0)) {
        query.sort = 'createdAt:desc';
    }
    const paginationSource = query.pagination && typeof query.pagination === 'object'
        ? { ...query.pagination }
        : {};
    const resolvedPage = (_c = (_b = (_a = parsePositiveInteger(paginationSource.page)) !== null && _a !== void 0 ? _a : parsePositiveInteger(paginationSource.pageNumber)) !== null && _b !== void 0 ? _b : parsePositiveInteger(query.page)) !== null && _c !== void 0 ? _c : DEFAULT_PAGE;
    const resolvedPageSize = (_f = (_e = (_d = parsePositiveInteger(paginationSource.pageSize)) !== null && _d !== void 0 ? _d : parsePositiveInteger(paginationSource.limit)) !== null && _e !== void 0 ? _e : parsePositiveInteger(query.pageSize)) !== null && _f !== void 0 ? _f : DEFAULT_PAGE_SIZE;
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
        const record = rel;
        if (Object.prototype.hasOwnProperty.call(record, 'id') &&
            (typeof record.id === 'number' || typeof record.id === 'string')) {
            return record.id;
        }
        if (Object.prototype.hasOwnProperty.call(record, 'documentId') &&
            typeof record.documentId === 'string') {
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
const extractEntityId = (value) => {
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'data')) {
        return extractEntityId(value.data);
    }
    return extractRelationId(value);
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
    const enumValues = schema &&
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
        const record = value;
        const candidates = ['displayName', 'name', 'username'];
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
const mapAuthorFields = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => mapAuthorFields(item));
    }
    if (value && typeof value === 'object') {
        const record = value;
        const transformedEntries = {};
        const hasAuthorSnapshot = Object.prototype.hasOwnProperty.call(record, 'author_displayName') ||
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
const transformControllerResponse = (response) => {
    if (!response || typeof response !== 'object') {
        return response;
    }
    if (Array.isArray(response)) {
        return response.map((item) => mapAuthorFields(item));
    }
    if (Object.prototype.hasOwnProperty.call(response, 'data')) {
        const mutableResponse = response;
        const data = mutableResponse.data;
        if (Array.isArray(data)) {
            mutableResponse.data = data.map((item) => mapAuthorFields(item));
        }
        else {
            mutableResponse.data = mapAuthorFields(data);
        }
        return response;
    }
    return mapAuthorFields(response);
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
        const record = value;
        if (Object.prototype.hasOwnProperty.call(record, 'id')) {
            return record.id;
        }
        if (Object.prototype.hasOwnProperty.call(record, 'data')) {
            return resolveUserId(record.data);
        }
    }
    return null;
};
const resolveUserDisplayName = (user) => {
    if (!user || typeof user !== 'object') {
        return FALLBACK_DISPLAY_NAME;
    }
    const record = user;
    const candidates = ['displayName', 'name', 'username'];
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
        const extracted = extractDisplayNameFromUser(record.data);
        if (extracted) {
            return extracted;
        }
    }
    return FALLBACK_DISPLAY_NAME;
};
const ensureLogger = (logger) => ({
    info: (logger === null || logger === void 0 ? void 0 : logger.info) ? logger.info.bind(logger) : defaultLogger.info.bind(defaultLogger),
    warn: (logger === null || logger === void 0 ? void 0 : logger.warn) ? logger.warn.bind(logger) : defaultLogger.warn.bind(defaultLogger),
    error: (logger === null || logger === void 0 ? void 0 : logger.error) ? logger.error.bind(logger) : defaultLogger.error.bind(defaultLogger),
});
const resolveArticleIdFromComment = (value) => {
    if (!value || typeof value !== 'object') {
        return extractRelationId(value);
    }
    const record = value;
    if (Object.prototype.hasOwnProperty.call(record, 'article')) {
        return extractRelationId(record.article);
    }
    if (Object.prototype.hasOwnProperty.call(record, 'attributes')) {
        return resolveArticleIdFromComment(record.attributes);
    }
    return extractRelationId(record);
};
const runAuthorDisplayNameBackfill = async (strapi, logger) => {
    var _a, _b, _c, _d, _e, _f;
    if (!((_a = strapi === null || strapi === void 0 ? void 0 : strapi.entityService) === null || _a === void 0 ? void 0 : _a.findMany) || !((_b = strapi === null || strapi === void 0 ? void 0 : strapi.entityService) === null || _b === void 0 ? void 0 : _b.update)) {
        return;
    }
    let processed = 0;
    while (true) {
        const missingComments = await strapi.entityService.findMany(COMMENT_UID, {
            filters: { author_displayName: { $null: true } },
            populate: { users_permissions_user: true },
            limit: MIGRATION_BATCH_SIZE,
        });
        if (!Array.isArray(missingComments) || missingComments.length === 0) {
            break;
        }
        for (const comment of missingComments) {
            const commentId = extractRelationId((_c = comment === null || comment === void 0 ? void 0 : comment.id) !== null && _c !== void 0 ? _c : comment);
            if (commentId === null || commentId === undefined) {
                logger.warn('[COMMENT_MIGRATION_SKIP]', {
                    reason: 'missing_comment_id',
                });
                continue;
            }
            const userRelation = (_d = comment === null || comment === void 0 ? void 0 : comment.users_permissions_user) !== null && _d !== void 0 ? _d : null;
            const derivedName = (_e = extractDisplayNameFromUser(userRelation)) !== null && _e !== void 0 ? _e : resolveUserDisplayName(userRelation);
            try {
                await strapi.entityService.update(COMMENT_UID, commentId, {
                    data: { author_displayName: derivedName || FALLBACK_DISPLAY_NAME },
                });
                processed += 1;
            }
            catch (error) {
                logger.error('[COMMENT_MIGRATION_ERROR]', {
                    commentId,
                    error: (_f = error === null || error === void 0 ? void 0 : error.message) !== null && _f !== void 0 ? _f : String(error),
                });
            }
        }
    }
    if (processed > 0) {
        logger.info('[COMMENT_MIGRATION_SUCCESS]', { processed });
    }
};
const ensureAuthorSnapshotBackfill = async (strapi, logger) => {
    if (migrationCompleted) {
        return;
    }
    if (!migrationPromise) {
        migrationPromise = runAuthorDisplayNameBackfill(strapi, logger)
            .then(() => {
            migrationCompleted = true;
        })
            .catch((error) => {
            var _a;
            logger.error('[COMMENT_MIGRATION_FAILURE]', {
                error: (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : String(error),
            });
        })
            .finally(() => {
            migrationPromise = null;
        });
    }
    try {
        await migrationPromise;
    }
    catch {
        // swallow errors to avoid breaking request flow; they are already logged.
    }
};
const createCommentControllerHandlers = ({ strapi, super: superController, metrics = globalMetricsStore, logger, }) => {
    const resolvedLogger = ensureLogger(logger);
    return {
        async find(ctx) {
            var _a, _b, _c;
            metrics.increment('GET');
            await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
            ctx.query = ctx.query || {};
            ensureQueryDefaults(ctx.query);
            const response = await superController.find(ctx);
            const transformed = transformControllerResponse(response);
            const resultCount = Array.isArray(transformed === null || transformed === void 0 ? void 0 : transformed.data)
                ? transformed.data.length
                : undefined;
            resolvedLogger.info('[COMMENT_FIND]', {
                userId: (_c = (_b = (_a = ctx === null || ctx === void 0 ? void 0 : ctx.state) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null,
                count: resultCount !== null && resultCount !== void 0 ? resultCount : 0,
            });
            return transformed;
        },
        async findOne(ctx) {
            var _a, _b, _c, _d;
            metrics.increment('GET');
            await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
            const response = await superController.findOne(ctx);
            const transformed = transformControllerResponse(response);
            const commentId = extractEntityId((_a = transformed === null || transformed === void 0 ? void 0 : transformed.data) !== null && _a !== void 0 ? _a : transformed);
            resolvedLogger.info('[COMMENT_FIND_ONE]', {
                userId: (_d = (_c = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.state) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null,
                commentId,
            });
            return transformed;
        },
        async create(ctx) {
            metrics.increment('POST');
            await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
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
            const response = await superController.create(ctx);
            const commentId = extractEntityId(response);
            resolvedLogger.info('[COMMENT_CREATE]', {
                commentId,
                userId: user.id,
                articleId,
            });
            return transformControllerResponse(response);
        },
        async update(ctx) {
            metrics.increment('PUT');
            await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
            const user = ctx.state.user;
            if (!user) {
                return ctx.unauthorized('You must be logged in to update a comment.');
            }
            const { id } = ctx.params;
            const existingComment = await strapi.entityService.findOne(COMMENT_UID, id, {
                populate: { users_permissions_user: true, article: true },
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
            const response = await superController.update(ctx);
            const commentId = extractEntityId(response);
            const articleId = resolveArticleIdFromComment(existingComment);
            resolvedLogger.info('[COMMENT_UPDATE]', {
                commentId,
                userId: user.id,
                articleId,
            });
            return transformControllerResponse(response);
        },
        async delete(ctx) {
            metrics.increment('DELETE');
            await ensureAuthorSnapshotBackfill(strapi, resolvedLogger);
            const user = ctx.state.user;
            if (!user) {
                return ctx.unauthorized('You must be logged in to delete a comment.');
            }
            const { id } = ctx.params;
            const existingComment = await strapi.entityService.findOne(COMMENT_UID, id, {
                populate: { users_permissions_user: true, article: true },
            });
            if (!existingComment) {
                return ctx.notFound('Comment not found.');
            }
            const ownerId = resolveUserId(existingComment.users_permissions_user);
            if (ownerId === null || String(ownerId) !== String(user.id)) {
                return ctx.forbidden('You are not allowed to delete this comment.');
            }
            const response = await superController.delete(ctx);
            const commentId = extractEntityId(response !== null && response !== void 0 ? response : { id });
            const articleId = resolveArticleIdFromComment(existingComment);
            resolvedLogger.info('[COMMENT_DELETE]', {
                commentId,
                userId: user.id,
                articleId,
            });
            return transformControllerResponse(response);
        },
    };
};
exports.createCommentControllerHandlers = createCommentControllerHandlers;
exports.default = strapi_1.factories.createCoreController(COMMENT_UID, ({ strapi }) => {
    const handlers = (0, exports.createCommentControllerHandlers)({
        strapi,
        super: {
            async find(ctx) {
                return super.find(ctx);
            },
            async findOne(ctx) {
                return super.findOne(ctx);
            },
            async create(ctx) {
                return super.create(ctx);
            },
            async update(ctx) {
                return super.update(ctx);
            },
            async delete(ctx) {
                return super.delete(ctx);
            },
        },
    });
    return handlers;
});