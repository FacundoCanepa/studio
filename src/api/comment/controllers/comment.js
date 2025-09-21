
// src/api/comment/controllers/comment.js
'use strict';

/**
 *  comment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  /**
   * Sobrescribe la acción 'create' por defecto.
   * @param {object} ctx - El contexto de la solicitud de Koa.
   */
  async create(ctx) {
    // 1. OBTENER EL USUARIO AUTENTICADO
    // ctx.state.user contiene la información del usuario que realiza la solicitud.
    // Esto es añadido automáticamente por el middleware de autenticación de Strapi.
    const user = ctx.state.user;

    // Si no hay un usuario en el estado, significa que la solicitud no está autenticada.
    // Devolvemos un error de no autorizado (401).
    if (!user) {
      return ctx.unauthorized('You must be logged in to create a comment.');
    }

    // 2. PREPARAR LOS DATOS DEL COMENTARIO
    // Obtenemos el cuerpo de la solicitud (request body).
    const body = ctx.request.body;

    // Creamos el objeto de datos para el nuevo comentario.
    // Asignamos el ID del usuario autenticado al campo 'author' del comentario.
    // Esto es crucial para la seguridad: el backend asigna el autor, no el frontend.
    const entity = await strapi.service('api::comment.comment').create({
      ...body,
      data: {
        ...body.data,
        author: user.id, // Asignación automática del autor.
      }
    });

    // 3. SANITIZAR Y DEVOLVER LA RESPUESTA
    // Usamos el servicio de sanitización de Strapi para limpiar la entidad
    // antes de devolverla, asegurando que solo se expongan los campos permitidos.
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    // Devolvemos la entidad sanitizada usando el helper de transformación de Strapi.
    return this.transformResponse(sanitizedEntity);
  },
}));
