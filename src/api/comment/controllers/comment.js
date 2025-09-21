'use strict';

/**
 *  comment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  /**
   * Sobrescribe la acción 'create' por defecto para asignar el autor automáticamente.
   * @param {object} ctx - El contexto de la solicitud de Koa.
   */
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to create a comment.');
    }

    const body = ctx.request.body;
    const { content, article, parent } = body.data;

    if (!content) {
      return ctx.badRequest('Comment content is required.');
    }
    
    // Asignar el `author` desde el `user` de la sesión (del plugin users-permissions)
    // El modelo `Comment` tiene una relación con `Author`, no con `User`.
    // Asumimos que tienes una lógica para encontrar o crear un `Author` a partir de un `User`.
    // Por simplicidad aquí, se asigna directamente. Asegúrate que la relación en `Comment`
    // apunte a `plugin::users-permissions.user`.
    const entityData = {
      content,
      author: user.id, // Asigna el ID del usuario de `users-permissions`
      estado: 'approved',
      article,
      parent,
    };

    const entity = await strapi.service('api::comment.comment').create({
      data: entityData,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  /**
   * Sobrescribe la acción 'update' para verificar la propiedad y limitar los campos.
   */
  async update(ctx) {
    const { id } = ctx.params;
    const { id: userId } = ctx.state.user;
    const { content } = ctx.request.body.data;

    // 1. Validar que solo se puede editar el 'content'
    if (Object.keys(ctx.request.body.data).length > 1 || !content) {
        return ctx.badRequest('Only the comment content can be edited.');
    }

    // 2. Verificar la propiedad del comentario
    const comment = await strapi.entityService.findOne('api::comment.comment', id, {
        populate: ['author'],
    });

    if (!comment) {
        return ctx.notFound('Comment not found.');
    }

    // La relación `author` en el comentario ahora apunta a `users-permissions.user`
    if (comment.author?.id !== userId) {
        return ctx.forbidden('You are not allowed to edit this comment.');
    }
    
    // 3. Llamar al servicio de 'update' con los datos validados
    const entity = await strapi.service('api::comment.comment').update(id, {
        data: { content },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  /**
   * Sobrescribe la acción 'delete' para verificar la propiedad.
   */
  async delete(ctx) {
    const { id } = ctx.params;
    const { id: userId } = ctx.state.user;

    const comment = await strapi.entityService.findOne('api::comment.comment', id, {
        populate: ['author'],
    });

    if (!comment) {
        return ctx.notFound('Comment not found.');
    }

    if (comment.author?.id !== userId) {
        return ctx.forbidden('You are not allowed to delete this comment.');
    }

    // Si la propiedad es correcta, procede con la eliminación por defecto.
    // Strapi por defecto dejará los 'children' huérfanos (parent se vuelve null).
    return await super.delete(ctx);
  },
  
  /**
   * Nueva acción para que un administrador apruebe un comentario.
   */
  async approve(ctx) {
    const { id } = ctx.params;
    
    // Aquí se podría añadir una lógica para verificar si el usuario es un administrador.
    // Por simplicidad, asumimos que la ruta estará protegida por middleware de admin.

    const entity = await strapi.service('api::comment.comment').update(id, {
        data: { estado: 'approved' },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },


  /**
   * Nueva acción para encontrar comentarios de un artículo específico.
   */
  async findByArticle(ctx) {
    const { id, documentId } = ctx.params;
    const { page = 1, pageSize = 10 } = ctx.query;

    if (!id && !documentId) {
      return ctx.badRequest('Article ID or Document ID must be provided.');
    }

    const articleFilter = id
      ? { article: { id: { $eq: id } } }
      : { article: { documentId: { $eq: documentId } } };

    const { results, pagination } = await strapi.entityService.findPage('api::comment.comment', {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      filters: {
        ...articleFilter,
        estado: { $eq: 'approved' },
        parent: { id: { $null: true } },
      },
      sort: { createdAt: 'desc' },
      populate: {
        author: {
          fields: ['id', 'username', 'name'],
          populate: {
            avatar: {
              fields: ['url', 'formats']
            }
          }
        },
        children: {
          sort: { createdAt: 'asc' },
          populate: {
            author: {
              fields: ['id', 'username', 'name'],
               populate: {
                avatar: {
                  fields: ['url', 'formats']
                }
              }
            },
            // Se puede anidar más niveles si se desea, pero con moderación.
            children: {
                 populate: {
                    author: {
                        fields: ['id', 'username', 'name'],
                        populate: {
                            avatar: {
                            fields: ['url', 'formats']
                            }
                        }
                    }
                }
            }
          }
        }
      }
    });

    const sanitizedResults = await this.sanitizeOutput(results, ctx);

    return this.transformResponse({
      data: sanitizedResults,
      meta: { pagination }
    });
  },
}));
