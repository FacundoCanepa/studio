const DEFAULT_TTL = 60_000;

export interface MemoFetchOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

interface CacheEntry {
  expiry: number;
  promise: Promise<Response>;
}

const memoizedFetchMap = new Map<string, CacheEntry>();

const RATE_LIMIT_WINDOW_MS = 5_000;
const RATE_LIMIT_THRESHOLD = 3;
const RATE_LIMIT_BLOCK_MS = 30_000;

type RateLimitEntry = {
  timestamps: number[];
  blockedUntil?: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();
interface CacheKeyResult {
  key: string;
  canCache: boolean;
}

type RequestLike = {
  url: string;
};

const hasUrl = (value: unknown): value is RequestLike => {
  return typeof value === 'object' && value !== null && 'url' in value && typeof (value as Record<string, unknown>).url === 'string';
};

const headersToObject = (headers: HeadersInit): Record<string, string> => {
  if (headers instanceof Headers) {
    return Array.from(headers.entries()).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    }, {});
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[String(key).toLowerCase()] = String(value);
      return acc;
    }, {});
  }

  const record = headers as Record<string, string>;
  return Object.keys(record).reduce<Record<string, string>>((acc, key) => {
    acc[key.toLowerCase()] = String(record[key]);
    return acc;
  }, {});
};

const normalizeInit = (init?: RequestInit): { normalized: Record<string, unknown>; canCache: boolean } => {
  if (!init) {
    return { normalized: {}, canCache: true };
  }

  const normalized: Record<string, unknown> = {};
  let canCache = true;

  const relevantKeys: (keyof RequestInit)[] = [
    'method',
    'body',
    'cache',
    'credentials',
    'headers',
    'integrity',
    'keepalive',
    'mode',
    'redirect',
    'referrer',
    'referrerPolicy',
  ];

  for (const key of relevantKeys) {
    const value = init[key];
    if (typeof value === 'undefined') {
      continue;
    }

    if (key === 'headers') {
      normalized[key] = headersToObject(value as HeadersInit);
      continue;
    }

    if (key === 'body') {
      if (typeof value === 'string') {
        normalized[key] = value;
      } else if (value instanceof URLSearchParams) {
        normalized[key] = value.toString();
      } else {
        normalized[key] = '[non-serializable-body]';
        canCache = false;
      }
      continue;
    }

    normalized[key] = value;
  }

  return { normalized, canCache };
};
const resolveRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (hasUrl(input)) return input.url;
  return String(input);
};

const createCacheKey = (input: RequestInfo | URL, init?: RequestInit): CacheKeyResult => {
  const url = resolveRequestUrl(input);
  const { normalized, canCache } = normalizeInit(init);
  const key = JSON.stringify({ url, init: normalized });
  return { key, canCache };
};
const enforceClientRateLimit = (input: RequestInfo | URL) => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = resolveRequestUrl(input);
  const now = Date.now();
  const entry = rateLimitMap.get(url) ?? { timestamps: [] };

  if (entry.blockedUntil && entry.blockedUntil > now) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[memoFetch][rate-limit] Blocked excessive fetches for ${url} until ${new Date(entry.blockedUntil).toISOString()}.`);
    }
    // anti-spam guard
    throw new Error(`Rate limit exceeded for ${url}`);
  }

  entry.timestamps = entry.timestamps.filter((timestamp) => now - timestamp <= RATE_LIMIT_WINDOW_MS);
  entry.timestamps.push(now);

  if (entry.timestamps.length > RATE_LIMIT_THRESHOLD) {
    entry.blockedUntil = now + RATE_LIMIT_BLOCK_MS;
    entry.timestamps = [];
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[memoFetch][rate-limit] Temporarily blocking fetches for ${url} for ${RATE_LIMIT_BLOCK_MS}ms.`);
    }
    // anti-spam guard
    rateLimitMap.set(url, entry);
    throw new Error(`Rate limit exceeded for ${url}`);
  }

  entry.blockedUntil = undefined;
  rateLimitMap.set(url, entry);
};

export const invalidateMemoFetch = (input?: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'undefined') {
    memoizedFetchMap.clear();
    return;
  }

  const { key } = createCacheKey(input, init);
  memoizedFetchMap.delete(key);
};

export const memoFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  options: MemoFetchOptions = {}
): Promise<Response> => {
  enforceClientRateLimit(input);
  const { ttl = DEFAULT_TTL, forceRefresh = false } = options;
  const { key, canCache } = createCacheKey(input, init);

  if (!canCache) {
    return fetch(input, init);
  }

  const now = Date.now();

  if (forceRefresh) {
    memoizedFetchMap.delete(key);
  } else {
    const cached = memoizedFetchMap.get(key);
    if (cached && cached.expiry > now) {
      return cached.promise.then((response) => response.clone());
    }

    if (cached && cached.expiry <= now) {
      memoizedFetchMap.delete(key);
    }
  }

  const fetchPromise = fetch(input, init)
    .then((response) => {
      if (!response.ok) {
        memoizedFetchMap.delete(key);
      }
      return response;
    })
    .catch((error) => {
      memoizedFetchMap.delete(key);
      throw error;
    });

  memoizedFetchMap.set(key, {
    expiry: now + ttl,
    promise: fetchPromise,
  });

  return fetchPromise.then((response) => response.clone());
};

export const getMemoFetchCacheSize = () => memoizedFetchMap.size;

export default memoFetch;