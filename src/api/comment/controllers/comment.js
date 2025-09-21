// src/api/comment/controllers/comment.js
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
    // 1. OBTENER EL USUARIO AUTENTICADO
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to create a comment.');
    }

    // 2. PREPARAR LOS DATOS DEL COMENTARIO
    const body = ctx.request.body;
    const entityData = { ...body.data };

    // Asignación segura del autor y estado por defecto
    entityData.author = user.id;
    entityData.estado = 'approved';

    // Crear la entidad de comentario
    const entity = await strapi.service('api::comment.comment').create({
      ...body,
      data: entityData,
    });

    // 3. SANITIZAR Y DEVOLVER LA RESPUESTA
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  /**
   * Nueva acción para encontrar comentarios de un artículo específico.
   * @param {object} ctx - El contexto de la solicitud de Koa.
   */
  async findByArticle(ctx) {
    const { id, documentId } = ctx.params;
    const { page = 1, pageSize = 10 } = ctx.query;

    if (!id && !documentId) {
      return ctx.badRequest('Article ID or Document ID must be provided.');
    }

    // 1. Construir el filtro para el artículo
    const articleFilter = id
      ? { article: { id: { $eq: id } } }
      : { article: { documentId: { $eq: documentId } } };

    // 2. Usar entityService para encontrar comentarios con filtros y paginación
    const { results, pagination } = await strapi.entityService.findPage('api::comment.comment', {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      filters: {
        ...articleFilter,
        estado: { $eq: 'approved' },
        parent: { id: { $null: true } }, // Solo comentarios raíz
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
        children: { // Poblar comentarios anidados
          sort: { createdAt: 'asc' },
          populate: {
            author: { // Poblar el autor de los comentarios anidados
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
    });

    // 3. Sanitizar la salida antes de devolverla
    const sanitizedResults = await this.sanitizeOutput(results, ctx);

    // 4. Devolver la respuesta en el formato estándar de Strapi (datos + meta)
    return this.transformResponse({
      data: sanitizedResults,
      meta: { pagination }
    });
  },
}));
