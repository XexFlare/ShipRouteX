import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { apiKeyAuthMiddleware } from './api-key-auth';

/**
 * This hook isn't registered on the real app yet (see app.ts) — these tests
 * build a throwaway Fastify instance and wire it in manually, so the
 * middleware's own behavior is verified in isolation, ready for the day
 * `app.ts` actually registers it.
 */
function buildTestApp() {
  const app = Fastify({ logger: false });
  app.addHook('onRequest', apiKeyAuthMiddleware);
  app.get('/whoami', async (request) => ({ auth: request.auth ?? null }));
  return app;
}

describe('apiKeyAuthMiddleware', () => {
  it('attaches an AuthContext to the request when a bearer token is supplied', async () => {
    const app = buildTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/whoami',
      headers: { authorization: 'Bearer any-token-value' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().auth.authenticated).toBe(true);

    await app.close();
  });

  it('still authenticates when no Authorization header is present at all (mock auth never rejects)', async () => {
    const app = buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/whoami' });

    expect(response.statusCode).toBe(200);
    expect(response.json().auth.authenticated).toBe(true);

    await app.close();
  });
});
