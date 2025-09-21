import { proxyStrapiRequest } from '../strapi-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return proxyStrapiRequest(request, 'comments', { context: 'STRAPI_COMMENTS' });
}

export async function POST(request: Request) {
  return proxyStrapiRequest(request, 'comments', { context: 'STRAPI_COMMENTS' });
}