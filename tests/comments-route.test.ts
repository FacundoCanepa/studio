import assert from 'node:assert/strict';

interface RecordedRequest {
  url: string;
  init: RequestInit | undefined;
}

async function main() {
  const originalFetch = global.fetch;
  const previousStrapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  process.env.NEXT_PUBLIC_STRAPI_URL = 'https://strapi.test';

  const { GET } = await import(
    '../src/app/api/strapi/articles/document/[documentId]/comments/route'
  );

  const recorded: RecordedRequest[] = [];
  let callCount = 0;

  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    recorded.push({ url, init });
    callCount += 1;

    if (callCount === 1) {
      return new Response(JSON.stringify({ error: { message: 'Not Found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 10,
            pageCount: 0,
            total: 0,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const request = new Request(
      'https://example.com/api/strapi/articles/document/doc-123/comments?page=1&pageSize=10',
      {
        headers: {
          Authorization: 'Bearer test-token',
        },
      }
    );

    const response = await GET(request, { params: { documentId: 'doc-123' } });

    assert.equal(response.status, 200, 'Expected fallback response to succeed');

    const payload = await response.json();
    assert.deepEqual(payload, {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 10,
          pageCount: 0,
          total: 0,
        },
      },
    });

    assert.equal(recorded.length, 2, 'Expected two Strapi fetch calls');
    const firstRequestUrl = new URL(recorded[0].url);
    assert.equal(firstRequestUrl.pathname, '/api/articles/document/doc-123/comments');
    assert.equal(firstRequestUrl.search, '?page=1&pageSize=10');

    const fallbackUrl = new URL(recorded[1].url);
    assert.equal(fallbackUrl.pathname, '/api/comments');
    assert.equal(
      fallbackUrl.searchParams.get('filters[article][documentId][$eq]'),
      'doc-123'
    );
    assert.equal(fallbackUrl.searchParams.get('filters[parent][$null]'), 'true');
    assert.equal(fallbackUrl.searchParams.get('pagination[page]'), '1');
    assert.equal(fallbackUrl.searchParams.get('pagination[pageSize]'), '10');
    assert.equal(fallbackUrl.searchParams.get('sort[0]'), 'createdAt:desc');
    assert.equal(
      fallbackUrl.searchParams.get('populate[author][fields][0]'),
      'username'
    );
    assert.equal(
      fallbackUrl.searchParams.get('populate[author][fields][1]'),
      'name'
    );
    assert.equal(
      fallbackUrl.searchParams.get('populate[author][populate][avatar][fields][0]'),
      'url'
    );
    assert.equal(
      fallbackUrl.searchParams.get(
        'populate[children][populate][author][fields][0]'
      ),
      'username'
    );
    assert.equal(
      fallbackUrl.searchParams.get(
        'populate[children][populate][author][fields][1]'
      ),
      'name'
    );
    assert.equal(
      fallbackUrl.searchParams.get(
        'populate[children][populate][author][populate][avatar][fields][0]'
      ),
      'url'
    );
    assert.equal(
      fallbackUrl.searchParams.get(
        'populate[children][populate][children][populate][author][fields][0]'
      ),
      'username'
    );
    assert.equal(
      fallbackUrl.searchParams.get(
        'populate[children][populate][children][populate][author][fields][1]'
      ),
      'name'
    );
    assert.equal(
      fallbackUrl.searchParams.get(
        'populate[children][populate][children][populate][author][populate][avatar][fields][0]'
      ),
      'url'
    );

    const fallbackHeaders =
      recorded[1].init?.headers instanceof Headers
        ? recorded[1].init?.headers
        : new Headers(recorded[1].init?.headers ?? {});

    assert.equal(
      fallbackHeaders.get('Authorization'),
      'Bearer test-token',
      'Expected Authorization header to be forwarded'
    );
    assert.equal(
      fallbackHeaders.get('Accept'),
      'application/json',
      'Expected Accept header to be set'
    );

    console.log('Comments route fallback test passed');
  } finally {
    global.fetch = originalFetch;
    if (previousStrapiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_STRAPI_URL;
    } else {
      process.env.NEXT_PUBLIC_STRAPI_URL = previousStrapiUrl;
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});