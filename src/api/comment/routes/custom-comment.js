// src/api/comment/routes/custom-comment.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/:id/comments',
      handler: 'comment.findByArticle',
      config: {
        // No se requiere autenticación para esta ruta
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/articles/document/:documentId/comments',
      handler: 'comment.findByArticle',
      config: {
        // No se requiere autenticación para esta ruta
        auth: false,
      },
    },
  ],
};
