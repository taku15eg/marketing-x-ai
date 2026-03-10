import { test, expect } from '@playwright/test';

/**
 * E2E Tests: API Endpoints
 *
 * Tests the API routes directly via HTTP requests.
 */

test.describe('API: POST /api/analyze', () => {
  test('returns 400 for missing URL', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('URL');
  });

  test('returns 400 for invalid JSON body', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-json',
    });
    expect(response.status()).toBe(400);
  });

  test('returns 400 for SSRF attempt (localhost)', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { url: 'http://localhost:3000' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('returns 400 for SSRF attempt (internal IP)', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { url: 'http://10.0.0.1/admin' },
    });
    expect(response.status()).toBe(400);
  });

  test('returns 400 for SSRF attempt (metadata endpoint)', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { url: 'http://169.254.169.254/latest/meta-data/' },
    });
    expect(response.status()).toBe(400);
  });

  test('returns 400 for javascript: scheme', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { url: 'javascript:alert(1)' },
    });
    expect(response.status()).toBe(400);
  });

  test('returns CORS headers', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { url: 'https://example.com' },
    });
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
  });

  test('handles OPTIONS preflight', async ({ request }) => {
    const response = await request.fetch('/api/analyze', {
      method: 'OPTIONS',
    });
    expect(response.status()).toBe(204);
  });
});

test.describe('API: /api/share', () => {
  test('POST returns 400 for missing analysis_id', async ({ request }) => {
    const response = await request.post('/api/share', {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test('POST returns 404 for non-existent analysis', async ({ request }) => {
    const response = await request.post('/api/share', {
      data: { analysis_id: 'non-existent-id' },
    });
    expect(response.status()).toBe(404);
  });

  test('GET returns 400 for missing share id', async ({ request }) => {
    const response = await request.get('/api/share');
    expect(response.status()).toBe(400);
  });

  test('GET returns 404 for invalid share id', async ({ request }) => {
    const response = await request.get('/api/share?id=invalid-share');
    expect(response.status()).toBe(404);
  });

  test('handles OPTIONS preflight', async ({ request }) => {
    const response = await request.fetch('/api/share', {
      method: 'OPTIONS',
    });
    expect(response.status()).toBe(204);
  });
});
