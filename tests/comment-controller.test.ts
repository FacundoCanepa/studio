import assert from 'node:assert/strict';
import Module from 'node:module';

const originalLoad = Module._load;
Module._load = function patchedLoad(request: string, parent: any, isMain: boolean) {
  if (request === '@strapi/strapi') {
    return {
      factories: {
        createCoreController: () => ({}),
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: Record<string, unknown>;
}

const ownerUser = { id: 1, displayName: 'Owner One', username: 'owner' };
const outsiderUser = { id: 2, displayName: 'Visitor Two', username: 'visitor' };
const articleId = 101;

const createCtx = (overrides: Partial<any> = {}) => {
  const baseCtx: any = {
    state: {},
    request: { body: { data: {} } },
    params: {},
    query: {},
    unauthorized(message: string) {
      return { status: 401, message };
    },
    badRequest(message: string) {
      return { status: 400, message };
    },
    forbidden(message: string) {
      return { status: 403, message };
    },
    notFound(message: string) {
      return { status: 404, message };
    },
  };

  return Object.assign(baseCtx, overrides);
};

async function runCommentControllerTests() {
  const {
    createCommentControllerHandlers,
    createInMemoryCommentMetrics,
    resetCommentControllerStateForTests,
  } = await import('../src/api/comment/controllers/comment');

  resetCommentControllerStateForTests();

  const updates: any[] = [];
  const createBodies: any[] = [];
  const updateBodies: any[] = [];
  const deleteCalls: any[] = [];
  const findQueries: any[] = [];
  const logs: LogEntry[] = [];

  const existingComments = new Map<string, any>();
  existingComments.set('300', {
    id: 300,
    users_permissions_user: { id: ownerUser.id },
    article: { id: articleId },
  });
  existingComments.set('301', {
    id: 301,
    users_permissions_user: { id: ownerUser.id },
    article: { id: articleId },
  });

  let migrationFindManyCalls = 0;

  const strapiStub = {
    contentType() {
      return {
        attributes: {
          estado: { enum: ['approved', 'pending', 'rejected'] },
        },
      };
    },
    entityService: {
      async findMany() {
        migrationFindManyCalls += 1;
        if (migrationFindManyCalls === 1) {
          return [
            {
              id: 999,
              author_displayName: null,
              users_permissions_user: { displayName: 'Legacy Name' },
            },
          ];
        }

        return [];
      },
      async update(uid: string, id: any, payload: any) {
        updates.push({ uid, id, payload });
        return { id, ...payload };
      },
      async findOne(uid: string, id: any) {
        return existingComments.get(String(id)) ?? null;
      },
    },
  };

  const metrics = createInMemoryCommentMetrics();
  const logger = {
    info(message: string, meta?: Record<string, unknown>) {
      logs.push({ level: 'info', message, meta });
    },
    warn(message: string, meta?: Record<string, unknown>) {
      logs.push({ level: 'warn', message, meta });
    },
    error(message: string, meta?: Record<string, unknown>) {
      logs.push({ level: 'error', message, meta });
    },
  };

  const superController = {
    async find(ctx: any) {
      findQueries.push(JSON.parse(JSON.stringify(ctx.query)));
      return {
        data: [
          {
            id: 401,
            attributes: {
              content: 'Root comment',
              author_displayName: 'Owner Snapshot',
              users_permissions_user: {
                data: {
                  id: ownerUser.id,
                  attributes: {
                    displayName: ownerUser.displayName,
                  },
                },
              },
              children: {
                data: [
                  {
                    id: 402,
                    attributes: {
                      content: 'Child comment',
                      author_displayName: null,
                      users_permissions_user: {
                        data: {
                          id: ownerUser.id,
                          attributes: {
                            displayName: ownerUser.displayName,
                          },
                        },
                      },
                      children: { data: [] },
                    },
                  },
                ],
              },
            },
          },
        ],
        meta: { pagination: { page: 1, pageSize: 10, total: 1 } },
      };
    },
    async findOne() {
      return {
        data: {
          id: 401,
          attributes: {
            content: 'Root comment',
            author_displayName: 'Owner Snapshot',
            users_permissions_user: {
              data: {
                id: ownerUser.id,
                attributes: { displayName: ownerUser.displayName },
              },
            },
            children: { data: [] },
          },
        },
      };
    },
    async create(ctx: any) {
      createBodies.push(JSON.parse(JSON.stringify(ctx.request.body)));
      return {
        data: {
          id: 501,
          attributes: {
            content: ctx.request.body.data.content,
            author_displayName: ctx.request.body.data.author_displayName,
            users_permissions_user: {
              data: {
                id: ownerUser.id,
                attributes: { displayName: ownerUser.displayName },
              },
            },
            article: { data: { id: articleId } },
            children: { data: [] },
          },
        },
      };
    },
    async update(ctx: any) {
      updateBodies.push(JSON.parse(JSON.stringify(ctx.request.body)));
      return {
        data: {
          id: Number(ctx.params.id),
          attributes: {
            content: ctx.request.body.data.content,
            estado: ctx.request.body.data.estado,
            author_displayName: 'Owner Snapshot',
            users_permissions_user: {
              data: {
                id: ownerUser.id,
                attributes: { displayName: ownerUser.displayName },
              },
            },
            article: { data: { id: articleId } },
            children: { data: [] },
          },
        },
      };
    },
    async delete(ctx: any) {
      deleteCalls.push({ id: ctx.params.id });
      return { data: { id: Number(ctx.params.id) } };
    },
  };

  const controller = createCommentControllerHandlers({
    strapi: strapiStub,
    super: superController,
    metrics,
    logger,
  });

  const findCtx = createCtx({ state: { user: ownerUser } });
  const findResult = await controller.find(findCtx);
  assert.ok(migrationFindManyCalls >= 1, 'migration should run before first query');
  assert.equal(updates.length, 1, 'migration should update missing display names');
  assert.equal(updates[0].payload.data.author_displayName, 'Legacy Name');
  assert.equal(metrics.snapshot().GET, 1, 'GET metric should increment on find');
  assert.equal(findQueries.length, 1, 'find should call underlying super.find exactly once');
  assert.equal(findQueries[0].sort, 'createdAt:desc');
  assert.ok(findResult?.data?.[0]?.attributes?.author, 'author should be present on find result');
  assert.equal(
    findResult.data[0].attributes.author.displayName,
    'Owner Snapshot',
    'author snapshot should be exposed'
  );
  assert.ok(
    !('users_permissions_user' in findResult.data[0].attributes),
    'users_permissions_user should be removed from root comment'
  );
  const child = findResult.data[0].attributes.children.data[0];
  assert.equal(
    child.attributes.author.displayName,
    ownerUser.displayName,
    'child comment should derive author from user relation'
  );
  assert.ok(
    !('users_permissions_user' in child.attributes),
    'child comment should not expose users_permissions_user'
  );

  const findOneResult = await controller.findOne(createCtx({ params: { id: '401' } }));
  assert.equal(metrics.snapshot().GET, 2, 'GET metric should include findOne');
  assert.equal(
    findOneResult.data.attributes.author.displayName,
    'Owner Snapshot',
    'findOne should expose author display name'
  );

  const unauthorizedCreate = await controller.create(
    createCtx({
      request: { body: { data: { content: 'Hola', article: { id: articleId } } } },
    })
  );
  assert.equal(unauthorizedCreate.status, 401, 'create should require authentication');
  assert.equal(metrics.snapshot().POST, 1, 'POST metric should track unauthorized attempt');

  const createResult = await controller.create(
    createCtx({
      state: { user: ownerUser },
      request: {
        body: {
          data: {
            content: '  Nuevo comentario  ',
            article: { id: articleId },
            estado: 'approved',
          },
        },
      },
    })
  );
  assert.equal(metrics.snapshot().POST, 2, 'POST metric should include authorized creation');
  assert.equal(createBodies.length, 1, 'create should forward exactly one request to Strapi');
  assert.equal(createBodies[0].data.content, 'Nuevo comentario');
  assert.equal(createBodies[0].data.users_permissions_user, ownerUser.id);
  assert.equal(createBodies[0].data.author_displayName, ownerUser.displayName);
  assert.equal(createBodies[0].data.estado, 'approved');
  assert.ok(
    !('author' in createBodies[0].data),
    'sanitized payload should not include author wrapper'
  );
  assert.equal(
    createResult.data.attributes.author.displayName,
    ownerUser.displayName,
    'create response should expose author display name'
  );

  const updateUnauthorized = await controller.update(
    createCtx({
      params: { id: '300' },
      request: { body: { data: { content: 'Cambio' } } },
    })
  );
  assert.equal(updateUnauthorized.status, 401, 'update should require authentication');
  assert.equal(metrics.snapshot().PUT, 1, 'PUT metric should track unauthorized attempt');

  const updateForbidden = await controller.update(
    createCtx({
      state: { user: outsiderUser },
      params: { id: '300' },
      request: { body: { data: { content: 'Cambio' } } },
    })
  );
  assert.equal(updateForbidden.status, 403, 'update should reject non-owners');
  assert.equal(metrics.snapshot().PUT, 2, 'PUT metric should include forbidden attempt');

  const updateResult = await controller.update(
    createCtx({
      state: { user: ownerUser },
      params: { id: '300' },
      request: {
        body: {
          data: { content: '  Ajustado  ', estado: 'pending' },
        },
      },
    })
  );
  assert.equal(metrics.snapshot().PUT, 3, 'PUT metric should include successful update');
  assert.equal(updateBodies.length, 1, 'update should forward a single payload');
  assert.deepEqual(updateBodies[0].data, { content: 'Ajustado', estado: 'pending' });
  assert.equal(
    updateResult.data.attributes.author.displayName,
    'Owner Snapshot',
    'update should preserve author snapshot'
  );

  const deleteUnauthorized = await controller.delete(createCtx({ params: { id: '301' } }));
  assert.equal(deleteUnauthorized.status, 401, 'delete should require authentication');
  assert.equal(metrics.snapshot().DELETE, 1, 'DELETE metric should track unauthorized attempt');

  const deleteForbidden = await controller.delete(
    createCtx({ state: { user: outsiderUser }, params: { id: '301' } })
  );
  assert.equal(deleteForbidden.status, 403, 'delete should reject non-owners');
  assert.equal(metrics.snapshot().DELETE, 2, 'DELETE metric should include forbidden attempt');

  const deleteResult = await controller.delete(
    createCtx({ state: { user: ownerUser }, params: { id: '301' } })
  );
  assert.equal(metrics.snapshot().DELETE, 3, 'DELETE metric should include successful delete');
  assert.equal(deleteCalls.length, 1, 'delete should forward call to Strapi once');
  assert.equal(deleteResult.data.id, 301, 'delete should propagate comment id');

  const createLog = logs.find((entry) => entry.message === '[COMMENT_CREATE]');
  assert.ok(createLog, 'create should emit audit log');
  assert.equal(createLog?.meta?.articleId, articleId);
  assert.equal(createLog?.meta?.userId, ownerUser.id);
  assert.equal(createLog?.meta?.commentId, 501);

  const updateLog = logs.find((entry) => entry.message === '[COMMENT_UPDATE]');
  assert.ok(updateLog, 'update should emit audit log');
  assert.equal(updateLog?.meta?.commentId, 300);

  const deleteLog = logs.find((entry) => entry.message === '[COMMENT_DELETE]');
  assert.ok(deleteLog, 'delete should emit audit log');
  assert.equal(deleteLog?.meta?.commentId, 301);

  const migrationLog = logs.find((entry) => entry.message === '[COMMENT_MIGRATION_SUCCESS]');
  assert.ok(migrationLog, 'migration should emit success log');
  assert.equal(migrationLog?.meta?.processed, 1);

  console.log('Comment controller tests passed');
}

runCommentControllerTests().catch(error => {
  console.error(error);
  process.exitCode = 1;
});