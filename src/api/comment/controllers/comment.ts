// src/api/comment/controllers/comment.ts
'use strict';

/**
 *  comment controller
 */

import { factories } from '@strapi/strapi';

/**
 * Renombra la relación users_permissions_user -> author en cualquier nivel
 */
const renameUsersPermissionsUserToAuthor = (value: any): any => {
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
};

/**
 * Extrae un id/documentId desde distintas formas de relación aceptadas
 * Admite: number | string | { id } | { documentId } | { connect: ... }
 */
const extractRelationId = (rel: any): string | number | null => {
  if (rel === null || rel === undefined) return null;
  if (typeof rel === 'number' || typeof rel === 'string') return rel;

  if (typeof rel === 'object') {
    if ('id' in rel && (typeof rel.id === 'number' || typeof rel.id === 'string')) {
      return rel.id;
    }
    if ('documentId' in rel && typeof rel.documentId === 'string') {
      return rel.documentId;
    }
    if ('connect' in rel) {
      return extractRelationId(rel.connect);
    }
  }

  return null;
};

export default factories.createCoreController('api::comment.comment', ({ strapi }) => ({

  /**
   * Sobrescribe 'create' para asignar autor automáticamente y validar parent/article.
   */
  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to create a comment.');
    }

    const body = ctx.request.body;
    if (!body || !body.data) {
      return ctx.badRequest('Request data is required.');
    }

    const { content, article, parent } = body.data;

    if (!content) {
      return ctx.badRequest('Comment content is required.');
    }

    const articleId = extractRelationId(article);
    if (articleId === null || articleId === undefined) {
      return ctx.badRequest('Article is required.');
    }

    // Si viene parent, validamos que pertenezca al mismo artículo
    if (parent !== undefined && parent !== null) {
      const parentId = extractRelationId(parent);
      if (parentId === null || parentId === undefined) {
        return ctx.badRequest('Invalid parent comment id.');
      }

      // entityService.findOne requiere el id numérico/string del comentario
      let parentComment: any = null;
      try {
        parentComment = await strapi.entityService.findOne(
          'api::comment.comment',
          parentId as any,
          { populate: ['article'] }
        );
      } catch {
        parentComment = null;
      }

      if (!parentComment) {
        return ctx.badRequest('Parent comment not found.');
      }

      const parentArticleId = extractRelationId(parentComment.article);
      if (
        parentArticleId === null ||
        String(parentArticleId) !== String(articleId)
      ) {
        return ctx.badRequest('Parent comment must belong to the same article.');
      }
    }

    const entityData: Record<string, unknown> = {
      content,
      users_permissions_user: user.id, // asigna autor desde users-permissions
      estado: 'approved',               // por defecto aprobado (ajusta si querés moderación)
      article,                          // pasamos la relación tal como vino
    };

    if (parent !== undefined && parent !== null) {
      entityData.parent = parent;
    }

    const entity = await strapi.service('api::comment.comment').create({
      data: entityData,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    const renamedEntity = renameUsersPermissionsUserToAuthor(sanitizedEntity);
    return this.transformResponse(renamedEntity);
  },

  /**
   * Actualiza solo el 'content' y valida propiedad.
   */
  async update(ctx: any) {
    const { id } = ctx.params;
    const { id: userId } = ctx.state.user || {};
    const data = ctx.request.body?.data ?? {};
    const { content } = data;

    // 1) Solo permitir editar 'content' y exigirlo
    if (!content || Object.keys(data).some((k) => k !== 'content')) {
      return ctx.badRequest('Only the comment content can be edited.');
    }

    // 2) Verificar propiedad del comentario
    const comment = await strapi.entityService.findOne('api::comment.comment', id, {
      populate: ['users_permissions_user'],
    });

    if (!comment) {
      return ctx.notFound('Comment not found.');
    }

    if (!userId || comment.users_permissions_user?.id !== userId) {
      return ctx.forbidden('You are not allowed to edit this comment.');
    }

    // 3) Actualizar
    const entity = await strapi.service('api::comment.comment').update(id, {
      data: { content },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    const renamedEntity = renameUsersPermissionsUserToAuthor(sanitizedEntity);
    return this.transformResponse(renamedEntity);
  },

  /**
   * Elimina validando propiedad.
   */
  async delete(ctx: any) {
    const { id } = ctx.params;
    const { id: userId } = ctx.state.user || {};

    const comment = await strapi.entityService.findOne('api::comment.comment', id, {
      populate: ['users_permissions_user'],
    });

    if (!comment) {
      return ctx.notFound('Comment not found.');
    }

    if (!userId || comment.users_permissions_user?.id !== userId) {
      return ctx.forbidden('You are not allowed to delete this comment.');
    }

    const entity = await strapi.service('api::comment.comment').delete(id);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    const renamedEntity = renameUsersPermissionsUserToAuthor(sanitizedEntity);
    return this.transformResponse(renamedEntity);
  },

  /**
   * Acción para que un admin apruebe un comentario.
   * (Recomendado proteger con permisos/roles en rutas)
   */
  async approve(ctx: any) {
    const { id } = ctx.params;

    const entity = await strapi.service('api::comment.comment').update(id, {
      data: { estado: 'approved' },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    const renamedEntity = renameUsersPermissionsUserToAuthor(sanitizedEntity);
    return this.transformResponse(renamedEntity);
  },

  /**
   * Lista comentarios aprobados por artículo (por id o documentId), solo raíz + hijos.
   * Paginado y ordenado.
   */
  async findByArticle(ctx: any) {
    const { id, documentId } = ctx.params;
    const page = parseInt(String(ctx.query?.page ?? '1'), 10) || 1;
    const pageSize = parseInt(String(ctx.query?.pageSize ?? '10'), 10) || 10;

    if (!id && !documentId) {
      return ctx.badRequest('Article ID or Document ID must be provided.');
    }

    const articleFilter = id
      ? { article: { id: { $eq: id } } }
      : { article: { documentId: { $eq: documentId } } };
    
    // En Strapi v5 existe entityService.findPage; en v4 usar findMany con pagination
    const hasFindPage = typeof (strapi.entityService as any).findPage === 'function';

    const populateQuery = {
        users_permissions_user: {
          fields: ['id', 'username'],
          populate: {
            avatar: { fields: ['url', 'formats'] },
          },
        },
        children: {
          sort: { createdAt: 'asc' },
          populate: {
            users_permissions_user: {
              fields: ['id', 'username'],
              populate: {
                avatar: { fields: ['url', 'formats'] },
              },
            },
            children: {
              populate: {
                users_permissions_user: {
                  fields: ['id', 'username'],
                  populate: {
                    avatar: { fields: ['url', 'formats'] },
                  },
                },
              },
            },
          },
        },
    };
    
    // El método `findPage` es más moderno y recomendado si está disponible
    if (hasFindPage) {
      try {
        const { results, pagination } = await (strapi.entityService as any).findPage('api::comment.comment', {
          page,
          pageSize,
          filters: {
            ...articleFilter,
            estado: { $eq: 'approved' },
            parent: { id: { $null: true } },
          },
          sort: { createdAt: 'desc' },
          populate: populateQuery,
        });

        const sanitizedResults = await this.sanitizeOutput(results, ctx);
        const renamedResults = renameUsersPermissionsUserToAuthor(sanitizedResults);

        return this.transformResponse({
          data: renamedResults,
          meta: { pagination },
        });
      } catch (e: any) {
        console.error('[findByArticle][ERROR] Error during findPage:', e);
        return ctx.internalServerError('An error occurred while fetching comments.');
      }
    }

    // Fallback para versiones de Strapi que no tienen findPage
    try {
        const results = await strapi.entityService.findMany('api::comment.comment', {
          filters: {
            ...articleFilter,
            estado: { $eq: 'approved' },
            parent: { id: { $null: true } },
          },
          sort: { createdAt: 'desc' },
          populate: populateQuery,
          pagination: { page, pageSize },
        });
        
        const sanitizedResults = await this.sanitizeOutput(results, ctx);
        const renamedResults = renameUsersPermissionsUserToAuthor(sanitizedResults);

        return this.transformResponse({
          data: renamedResults,
          meta: {
            pagination: {
              page,
              pageSize,
              pageCount: Math.ceil(results.length / pageSize),
              total: results.length,
            },
          },
        });
    } catch (e: any) {
        console.error('[findByArticle][ERROR][v4] Error during findMany:', e);
        return ctx.internalServerError('An error occurred while fetching comments.');
    }
  },
}));
