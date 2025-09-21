// src/api/comment/routes/custom-comment.ts
export default {
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
        // policies: ['is-admin'],
      },
    },
  ],
};
