import { NextRequest } from 'next/server';
import { API_BASE } from '@/lib/api-utils';
import type { StrapiSingleCommentResponse } from '@/lib/strapi-comments';

export function resolveStrapiError(payload: any, fallback: string): string {
  if (payload?.error?.message && typeof payload.error.message === 'string') {
    return payload.error.message;
  }
  if (payload?.message && typeof payload.message === 'string') {
    return payload.message;
  }
  return fallback;
}

export async function readJsonBody(request: NextRequest): Promise<any> {
  try {
    const text = await request.text();
    if (!text) {
      return {};
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('[COMMENTS_BODY_PARSE_ERROR]', error);
    throw new Error('El cuerpo de la solicitud no es un JSON válido.');
  }
}

export async function forwardToStrapi(
  path: string,
  token: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<Response> {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_STRAPI_URL no está configurado.');
  }

  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    body = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...init,
    headers,
    body,
    cache: 'no-store',
  });
}

export async function handleStrapiResponse(
  response: Response,
  fallbackMessage: string,
): Promise<StrapiSingleCommentResponse | StrapiSingleCommentResponse['data']> {
  let payload: any = null;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else if (response.status !== 204) {
    const text = await response.text().catch(() => '');
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
  }

  if (!response.ok) {
    const message = resolveStrapiError(payload, fallbackMessage);
    throw new Error(message);
  }

  return payload as StrapiSingleCommentResponse;
}