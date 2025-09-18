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

const createCacheKey = (input: RequestInfo | URL, init?: RequestInit): CacheKeyResult => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : hasUrl(input) ? input.url : String(input);
  const { normalized, canCache } = normalizeInit(init);
  const key = JSON.stringify({ url, init: normalized });
  return { key, canCache };
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