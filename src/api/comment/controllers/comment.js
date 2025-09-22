'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

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
    if (Object.prototype.hasOwnProperty.call(value, 'id')) {
      return value.id;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'data')) {
      return resolveUserId(value.data);
    }
  }

  return null;
};

const extractDisplayNameFromUser = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const displayName = extractDisplayNameFromUser(item);
      if (displayName !== null && displayName !== undefined) {
        return displayName;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    if (typeof value.name === 'string' && value.name.trim() !== '') {
      return value.name;
    }

    if (typeof value.username === 'string' && value.username.trim() !== '') {
      return value.username;
    }

    if (typeof value.displayName === 'string' && value.displayName.trim() !== '') {
      return value.displayName;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'attributes')) {
      const fromAttributes = extractDisplayNameFromUser(value.attributes);
      if (fromAttributes !== null && fromAttributes !== undefined) {
        return fromAttributes;
      }
    }

    if (Object.prototype.hasOwnProperty.call(value, 'data')) {
      return extractDisplayNameFromUser(value.data);
    }
  }

  return null;
};

const mapAuthorFields = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => mapAuthorFields(item));
  }

  if (value && typeof value === 'object') {
    const hasAuthorFields =
      Object.prototype.hasOwnProperty.call(value, 'author_displayName') ||
      Object.prototype.hasOwnProperty.call(value, 'users_permissions_user');

    const transformedEntries = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === 'author_displayName' || key === 'users_permissions_user') {
        continue;
      }

      transformedEntries[key] = mapAuthorFields(nestedValue);
    }

    if (hasAuthorFields) {
      let displayName;

      if (Object.prototype.hasOwnProperty.call(value, 'author_displayName')) {
        displayName = value.author_displayName;
      }

      if (displayName === undefined) {
        displayName = extractDisplayNameFromUser(value.users_permissions_user);
      }

      if (displayName === undefined) {
        displayName = null;
      }

      transformedEntries.author = { displayName };
    }

    return transformedEntries;
  }

  return value;
};

const transformControllerResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const transformData = (data) => {
    if (Array.isArray(data)) {
      return data.map((item) => mapAuthorFields(item));
    }

    return mapAuthorFields(data);
  };

  if (Object.prototype.hasOwnProperty.call(response, 'data')) {
    response.data = transformData(response.data);
  }

  return response;
};

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to create a comment.');
    }

    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = ctx.request.body.data || {};

    const displayName = user.name || user.username || '';

    ctx.request.body.data = {
      ...ctx.request.body.data,
      users_permissions_user: user.id,
      author_displayName: displayName,
    };

    const response = await super.create(ctx);
    return transformControllerResponse(response);
  },

  async find(ctx) {
    ctx.query = ctx.query || {};

    if (!Object.prototype.hasOwnProperty.call(ctx.query, 'sort')) {
      ctx.query.sort = 'createdAt:desc';
    }

    const response = await super.find(ctx);
    return transformControllerResponse(response);
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    return transformControllerResponse(response);
  },

  async update(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to update a comment.');
    }

    const { id } = ctx.params;

    const existingComment = await strapi.entityService.findOne('api::comment.comment', id, {
      populate: { users_permissions_user: true },
    });

    if (!existingComment) {
      return ctx.notFound('Comment not found.');
    }

    const ownerId = resolveUserId(existingComment.users_permissions_user);

    if (ownerId === null || String(ownerId) !== String(user.id)) {
      return ctx.forbidden('You are not allowed to update this comment.');
    }

    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = ctx.request.body.data || {};

    if (
      Object.prototype.hasOwnProperty.call(ctx.request.body.data, 'users_permissions_user') ||
      Object.prototype.hasOwnProperty.call(ctx.request.body.data, 'author_displayName')
    ) {
      return ctx.badRequest('Updating the comment owner or author snapshot is not allowed.');
    }

    const response = await super.update(ctx);
    return transformControllerResponse(response);
  },

  async delete(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to delete a comment.');
    }

    const { id } = ctx.params;

    const existingComment = await strapi.entityService.findOne('api::comment.comment', id, {
      populate: { users_permissions_user: true },
    });

    if (!existingComment) {
      return ctx.notFound('Comment not found.');
    }

    const ownerId = resolveUserId(existingComment.users_permissions_user);

    if (ownerId === null || String(ownerId) !== String(user.id)) {
      return ctx.forbidden('You are not allowed to delete this comment.');
    }

    const response = await super.delete(ctx);
    return transformControllerResponse(response);
  },
}));