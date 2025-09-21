// src/api/comment/routes/custom-comment.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/:id/comments',
      handler: 'comment.findByArticle',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/articles/document/:documentId/comments',
      handler: 'comment.findByArticle',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/comments/:id/approve',
      handler: 'comment.approve',
      config: {
        // Por defecto, las rutas personalizadas requieren autenticación.
        // Se pueden añadir políticas aquí para restringir solo a admins.
        // policies: ['is-admin'],
      },
    },
  ],
};
