import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_STRAPI_URL = 'https://strapi.test';

let fetchCalls = 0;

const buildSuccessResponse = () =>
  new Response(JSON.stringify({ data: { ok: true } }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });

global.fetch = async () => {
  fetchCalls += 1;
  return buildSuccessResponse();
};

const buildRequest = (headers: Record<string, string>) =>
  new Request('https://example.com/api/strapi/comments', {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json', ...headers }),
    body: JSON.stringify({ data: { content: 'Test' } }),
  });

async function runRateLimitTests() {
  const { POST, resetCommentRateLimiterForTests } = await import('../src/app/api/strapi/comments/route');

  resetCommentRateLimiterForTests();
  fetchCalls = 0;

  const baseHeaders = { 'x-user-id': 'user-1', 'x-forwarded-for': '10.0.0.1' };

  for (let i = 0; i < 5; i += 1) {
    const response = await POST(buildRequest(baseHeaders));
    assert.equal(response.status, 201, 'expected proxy to forward allowed requests');
    const payload = await response.json();
    assert.equal(payload.data.ok, true);
  }

  assert.equal(fetchCalls, 5, 'fetch should be called for allowed requests');

  const limitedResponse = await POST(buildRequest(baseHeaders));
  assert.equal(limitedResponse.status, 429, 'sixth request should be rate limited');
  assert.equal(limitedResponse.headers.get('Retry-After'), '60');
  const limitedPayload = await limitedResponse.json();
  assert.ok(limitedPayload.error.includes('límite'), 'rate limited response should contain error message');
  assert.equal(fetchCalls, 5, 'fetch should not be called when rate limit is hit');

  const otherUserResponse = await POST(
    buildRequest({ 'x-user-id': 'user-2', 'x-forwarded-for': '10.0.0.1' })
  );
  assert.equal(
    otherUserResponse.status,
    201,
    'rate limit should not leak across different authenticated users'
  );

  resetCommentRateLimiterForTests();
  fetchCalls = 0;

  for (let i = 0; i < 5; i += 1) {
    const response = await POST(buildRequest({ 'x-forwarded-for': '192.168.0.5' }));
    assert.equal(response.status, 201);
  }
  assert.equal(fetchCalls, 5);

  const blockedIpResponse = await POST(buildRequest({ 'x-forwarded-for': '192.168.0.5' }));
  assert.equal(blockedIpResponse.status, 429, 'same IP should be blocked after limit');

  const otherIpResponse = await POST(buildRequest({ 'x-forwarded-for': '192.168.0.6' }));
  assert.equal(otherIpResponse.status, 201, 'different IP should not inherit rate limit');

  console.log('Rate limiter tests passed');
}

runRateLimitTests().catch(error => {
  console.error(error);
  process.exitCode = 1;
});