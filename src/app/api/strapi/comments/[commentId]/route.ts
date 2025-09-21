import { proxyStrapiRequest } from '../../strapi-proxy';

export const dynamic = 'force-dynamic';

interface CommentRouteContext {
  params: { commentId: string };
}

function buildPath(commentId: string) {
  return `comments/${encodeURIComponent(commentId)}`;
}

export async function GET(request: Request, { params }: CommentRouteContext) {
  return proxyStrapiRequest(request, buildPath(params.commentId), { context: 'STRAPI_COMMENT' });
}

export async function PUT(request: Request, { params }: CommentRouteContext) {
  return proxyStrapiRequest(request, buildPath(params.commentId), { context: 'STRAPI_COMMENT' });
}

export async function DELETE(request: Request, { params }: CommentRouteContext) {
  return proxyStrapiRequest(request, buildPath(params.commentId), { context: 'STRAPI_COMMENT' });
}