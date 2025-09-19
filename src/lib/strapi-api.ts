// src/lib/strapi-api.ts
import 'server-only';

import type { StrapiResponse } from './strapi-types';

type JsonSerializableBody = Record<string, unknown> | unknown[];

export type StrapiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: RequestInit['body'] | JsonSerializableBody;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

const MIN_REVALIDATE_SECONDS = 3600;
function parseOptimizationEnabled(): boolean {
  const rawValue = process.env.STRAPI_OPTIMIZATION_ENABLED;
  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim().toLowerCase();
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
  }
  return true;
}

export const STRAPI_OPTIMIZATION_ENABLED = parseOptimizationEnabled();
function parseRevalidateSeconds(): number {
  const envValue = process.env.STRAPI_REVALIDATE_SECONDS;
  if (envValue) {
    const parsed = Number.parseInt(envValue, 10);
    if (Number.isFinite(parsed) && parsed >= MIN_REVALIDATE_SECONDS) {
      return parsed;
    }
  }
  return MIN_REVALIDATE_SECONDS;
}

export const STRAPI_REVALIDATE_SECONDS = parseRevalidateSeconds();

function requireEnv(name: 'NEXT_PUBLIC_STRAPI_URL' | 'STRAPI_API_TOKEN'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured in environment variables.`);
  }
  return value;
}

function getStrapiBaseUrl(): string {
  return requireEnv('NEXT_PUBLIC_STRAPI_URL');
}

function getStrapiToken(): string {
  return requireEnv('STRAPI_API_TOKEN');
}

function isJsonSerializableBody(body: unknown): body is JsonSerializableBody {
  if (body == null) {
    return false;
  }
  if (typeof body === 'string') {
    return false;
  }
  if (Array.isArray(body)) {
    return true;
  }
  return Object.prototype.toString.call(body) === '[object Object]';
}

function extractStrapiErrorMessage(payload: unknown): string | undefined {
  if (!payload) {
    return undefined;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload !== 'object') {
    return undefined;
  }

  const maybeError = (payload as any).error;
  const maybeMessage = (payload as any).message;

  if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
    return maybeMessage;
  }

  if (typeof maybeError === 'string' && maybeError.trim().length > 0) {
    return maybeError;
  }

  if (maybeError && typeof maybeError === 'object') {
    const directMessage = (maybeError as any).message;
    if (typeof directMessage === 'string' && directMessage.trim().length > 0) {
      return directMessage;
    }

    const detailErrors = (maybeError as any).details?.errors;
    if (Array.isArray(detailErrors) && detailErrors.length > 0) {
      const firstDetail = detailErrors[0];
      if (firstDetail) {
        if (typeof firstDetail === 'string' && firstDetail.trim().length > 0) {
          return firstDetail;
        }
        const detailMessage = (firstDetail as any).message;
        if (typeof detailMessage === 'string' && detailMessage.trim().length > 0) {
          return detailMessage;
        }
      }
    }
  }

  if (Array.isArray(maybeMessage) && maybeMessage.length > 0) {
    const first = maybeMessage[0];
    if (typeof first === 'string' && first.trim().length > 0) {
      return first;
    }
    if (first && typeof first === 'object') {
      const arrayMessage = (first as any).message;
      if (typeof arrayMessage === 'string' && arrayMessage.trim().length > 0) {
        return arrayMessage;
      }
    }
  }

  return undefined;
}

export async function fetchStrapi<T>(endpoint: string, init: StrapiFetchOptions = {}): Promise<T> {
  const baseUrl = getStrapiBaseUrl();
  const token = getStrapiToken();
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const headers = new Headers(init?.headers as HeadersInit | undefined);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);

    const originalBody = init?.body;
    let normalizedBody: BodyInit | null | undefined = undefined;

    if (isJsonSerializableBody(originalBody)) {
      normalizedBody = JSON.stringify(originalBody);
      headers.set('Content-Type', 'application/json');
    } else if (typeof originalBody === 'string') {
      normalizedBody = originalBody;
      headers.set('Content-Type', 'application/json');
    } else if (originalBody !== undefined) {
      normalizedBody = originalBody as BodyInit | null;
    }
    if (!STRAPI_OPTIMIZATION_ENABLED) {
      headers.delete('if-none-match');
      headers.delete('If-None-Match');
    }
    console.log(`[FETCH_STRAPI][REQUEST] ${method} ${url}`, { cache: init?.cache });

    const fetchOptionsWithHeaders: StrapiFetchOptions = {
      ...init,
      headers,
      body: normalizedBody,
    };

    let requestInit: RequestInit & { next?: { revalidate?: number; tags?: string[] } };

    if (!STRAPI_OPTIMIZATION_ENABLED) {
      const { next: _ignoredNext, body: _ignoredBody, ...rest } = fetchOptionsWithHeaders;
      requestInit = {
        ...rest,
        body: normalizedBody,
        cache: 'no-store',
      };
      // anti-spam guard
    } else {
      requestInit = {
        ...fetchOptionsWithHeaders,
        body: normalizedBody,
      };
    }

    const response = await fetch(url, requestInit);
    console.log(`[FETCH_STRAPI][RESPONSE] ${method} ${url}`, { status: response.status });

    if (response.status >= 400) {
      const contentType = response.headers.get('content-type') ?? '';
      let errorPayload: unknown;
      let errorMessage = `Strapi request failed with status ${response.status}`;

      if (contentType.includes('application/json')) {
        errorPayload = await response.json().catch(() => undefined);
        const extractedMessage = extractStrapiErrorMessage(errorPayload);
        if (extractedMessage) {
          errorMessage = extractedMessage;
        }
      } else {
        const errorText = await response.text().catch(() => '');
        if (errorText) {
          errorPayload = errorText;
          errorMessage = errorText;
        }
      }

      console.error(`[FETCH_STRAPI][ERROR_RESPONSE] ${method} ${url}`, {
        status: response.status,
        body: errorPayload,
      });

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      console.log(`[FETCH_STRAPI][SUCCESS] ${method} ${url}`, { status: response.status });
      return {} as T;
    }

    const json = await response.json().catch((e:any) => {
      console.error('[FETCH_STRAPI][JSON_PARSE_ERROR]', { url, method, message: e?.message });
      throw e;
    });

    console.log(`[FETCH_STRAPI][SUCCESS] ${method} ${url}`, { status: response.status });
    return json as T;

  } catch (error: any) {
    const errorModel = endpoint.split('/api/')[1]?.split('?')[0] || 'unknown';
    console.error('[FETCH_STRAPI][EXCEPTION]', { model: errorModel, url, method, message: error?.message });
    throw error;
  }
}

export async function performStrapiRequest(endpoint: string, options: StrapiFetchOptions): Promise<any> {
  const baseUrl = getStrapiBaseUrl();
  const absoluteUrl = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const url = new URL(absoluteUrl);
  const params = new URLSearchParams(url.search);
  const isPaginated = params.get('pagination[limit]') === '-1';

  console.log(`[PERFORM_STRAPI_REQUEST] Endpoint: ${endpoint}`, { isPaginated, method: options.method });
  
  if (options.method === 'GET' && isPaginated) {
    params.delete('pagination[limit]');
    params.set('pagination[pageSize]', '12'); // enforced pagination to reduce API calls
    
    let allResults: any[] = [];
    let page = 1;
    let totalPages = 1;

    console.log(`[PERFORM_STRAPI_REQUEST] Starting paginated fetch for ${url.pathname}`);
    do {
      params.set('pagination[page]', String(page));
      const currentUrl = `${url.pathname}?${params.toString()}`;
      try {
        const response = await fetchStrapi<StrapiResponse<any[]>>(currentUrl, { ...options, body: undefined });
        if (response.data && Array.isArray(response.data)) {
          allResults = allResults.concat(response.data);
        }
        if (response.meta?.pagination) {
          totalPages = response.meta.pagination.pageCount;
        } else {
          break;
        }
        page++;
      } catch (error) {
        console.error(`[PERFORM_STRAPI_REQUEST][ERROR] Failed to fetch page ${page} for ${url.pathname}`, error);
        break;
      }
    } while (page <= totalPages);
    
    console.log(`[PERFORM_STRAPI_REQUEST] Finished paginated fetch. Total items: ${allResults.length}`);
    return { data: allResults };
  }

  const finalUrl = `${url.pathname}?${params.toString()}`;
  return fetchStrapi<any>(finalUrl, options);
}

export async function getStrapiMediaUrl(relativePath?: string | null): Promise<string | undefined> {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;
    const baseUrl = getStrapiBaseUrl();
    return `${baseUrl.replace('/api', '')}${relativePath}`;
}