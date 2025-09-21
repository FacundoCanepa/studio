import assert from 'node:assert/strict';

import {
  buildFallbackQuery,
  renameUsersPermissionsUserToAuthor,
} from '../src/app/api/strapi/articles/document/[documentId]/comments/route';

const queryUrl = new URL('https://example.com/articles/comments?page=2');
const queryString = buildFallbackQuery('document-123', queryUrl);
const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);

const expectedPopulateKeys = [
  'populate[users_permissions_user][fields][0]',
  'populate[users_permissions_user][fields][1]',
  'populate[users_permissions_user][populate][avatar][fields][0]',
  'populate[children][populate][users_permissions_user][fields][0]',
  'populate[children][populate][users_permissions_user][fields][1]',
  'populate[children][populate][users_permissions_user][populate][avatar][fields][0]',
  'populate[children][populate][children][populate][users_permissions_user][fields][0]',
  'populate[children][populate][children][populate][users_permissions_user][fields][1]',
  'populate[children][populate][children][populate][users_permissions_user][populate][avatar][fields][0]',
];

expectedPopulateKeys.forEach(key => {
  assert.ok(
    params.has(key),
    `Expected fallback query to request ${key}, received ${queryString}`
  );
});
assert.equal(
    params.get('filters[parent][id][$null]'),
    'true',
    `Expected fallback query to request filters[parent][id][$null]=true, received ${queryString}`
  );
  
const fallbackPayload: any = {
  data: [
    {
      id: 1,
      attributes: {
        body: 'Root comment',
        users_permissions_user: {
          data: {
            id: 100,
            attributes: {
              username: 'root-user',
              name: 'Root User',
              avatar: {
                data: {
                  id: 200,
                  attributes: {
                    url: '/root.png',
                  },
                },
              },
            },
          },
        },
        children: {
          data: [
            {
              id: 2,
              attributes: {
                body: 'First reply',
                users_permissions_user: {
                  data: {
                    id: 101,
                    attributes: {
                      username: 'reply-user',
                      name: 'Reply User',
                      avatar: {
                        data: {
                          id: 201,
                          attributes: {
                            url: '/reply.png',
                          },
                        },
                      },
                    },
                  },
                },
                children: {
                  data: [
                    {
                      id: 3,
                      attributes: {
                        body: 'Nested reply',
                        users_permissions_user: {
                          data: {
                            id: 102,
                            attributes: {
                              username: 'nested-user',
                              name: 'Nested User',
                              avatar: {
                                data: {
                                  id: 202,
                                  attributes: {
                                    url: '/nested.png',
                                  },
                                },
                              },
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
        },
      },
    },
  ],
  meta: {
    pagination: {
      page: 1,
      pageSize: 10,
      total: 1,
    },
  },
};

renameUsersPermissionsUserToAuthor(fallbackPayload);

const rootComment = fallbackPayload.data[0];
assert.ok(rootComment.attributes.author, 'Root comment should expose author');
assert.equal(
  rootComment.attributes.author.data.attributes.username,
  'root-user',
  'Root author username should be preserved'
);
assert.equal(
  rootComment.attributes.author.data.attributes.avatar.data.attributes.url,
  '/root.png',
  'Root author avatar URL should be preserved'
);
assert.ok(
  !('users_permissions_user' in rootComment.attributes),
  'Root comment should not expose users_permissions_user after transformation'
);

const firstReply = rootComment.attributes.children.data[0];
assert.ok(firstReply.attributes.author, 'First reply should expose author');
assert.equal(
  firstReply.attributes.author.data.attributes.username,
  'reply-user',
  'First reply author username should be preserved'
);
assert.equal(
  firstReply.attributes.author.data.attributes.avatar.data.attributes.url,
  '/reply.png',
  'First reply author avatar URL should be preserved'
);
assert.ok(
  !('users_permissions_user' in firstReply.attributes),
  'First reply should not expose users_permissions_user after transformation'
);

const nestedReply = firstReply.attributes.children.data[0];
assert.ok(nestedReply.attributes.author, 'Nested reply should expose author');
assert.equal(
  nestedReply.attributes.author.data.attributes.username,
  'nested-user',
  'Nested reply author username should be preserved'
);
assert.equal(
  nestedReply.attributes.author.data.attributes.avatar.data.attributes.url,
  '/nested.png',
  'Nested reply author avatar URL should be preserved'
);
assert.ok(
  !('users_permissions_user' in nestedReply.attributes),
  'Nested reply should not expose users_permissions_user after transformation'
);

console.log('All comments route cases passed');