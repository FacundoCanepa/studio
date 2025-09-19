// src/lib/strapi-api.ts
'use server';

import type { StrapiResponse } from './strapi-types';

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://graceful-bear-073b8037ba.strapiapp.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export type StrapiFetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

const MIN_REVALIDATE_SECONDS = 3600;

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

export async function fetchStrapi<T>(endpoint: string, init: StrapiFetchOptions = {}): Promise<T> {
  const url = `${STRAPI_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  if (!STRAPI_TOKEN) {
    throw new Error('STRAPI_API_TOKEN must be configured in environment variables.');
  }

  try {
    const headers = new Headers(init?.headers as HeadersInit | undefined);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${STRAPI_TOKEN}`);

    if (typeof init?.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    console.log(`[FETCH_STRAPI] Requesting URL: ${url}`, { cache: init?.cache, method: init?.method });

    const response = await fetch(url, {
      ...init,
      headers,
    });
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[FETCH_STRAPI][ERROR_RESPONSE]`, { url, status: response.status, body: errorBody });
      throw new Error(`Strapi request failed with status ${response.status}: ${errorBody}`);
    }
    
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json().catch((e:any) => {
      console.error("[FETCH_STRAPI][JSON_PARSE_ERROR]", { url, message: e?.message });
      throw e;
    });

    console.log(`[FETCH_STRAPI][SUCCESS] Received data from ${url}.`);
    return json as T;

  } catch (error: any) {
    const errorModel = endpoint.split('/api/')[1]?.split('?')[0] || 'unknown';
    console.error('[FETCH_STRAPI][EXCEPTION]', { model: errorModel, url, message: error?.message });
    throw error;
  }
}

export async function performStrapiRequest(endpoint: string, options: StrapiFetchOptions): Promise<any> {
  const url = new URL(`${STRAPI_BASE_URL}${endpoint}`);
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
    return `${STRAPI_BASE_URL.replace('/api', '')}${relativePath}`;
}
