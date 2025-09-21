import { proxyStrapiRequest } from '../../../../strapi-proxy';

export const dynamic = 'force-dynamic';

interface DocumentCommentsContext {
  params: { documentId: string };
}

function buildPath(documentId: string) {
  return `articles/document/${encodeURIComponent(documentId)}/comments`;
}

export async function GET(request: Request, { params }: DocumentCommentsContext) {
  return proxyStrapiRequest(request, buildPath(params.documentId), {
    context: 'STRAPI_DOCUMENT_COMMENTS',
  });
}

export async function POST(request: Request, { params }: DocumentCommentsContext) {
  return proxyStrapiRequest(request, buildPath(params.documentId), {
    context: 'STRAPI_DOCUMENT_COMMENTS',
  });
}