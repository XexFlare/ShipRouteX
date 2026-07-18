import { MockAuthenticator, type AuthContext, type Authenticator } from '@shiproutesx/platform';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Set by `apiKeyAuthMiddleware` once it's registered. Undefined today,
     * since that hook isn't wired into `buildApp` yet — see this file's
     * top-level docs and docs/platform-architecture.md.
     */
    auth?: AuthContext;
  }
}

/**
 * The `Authenticator` this middleware validates against. A `MockAuthenticator`
 * for now (see `@shiproutesx/platform`) — swapping in a real implementation
 * here is the only change needed once real authentication ships; nothing
 * about the hook's shape below needs to change.
 */
const authenticator: Authenticator = new MockAuthenticator();

function extractApiKey(request: FastifyRequest): string | undefined {
  const header = request.headers['authorization'];
  if (typeof header !== 'string') return undefined;

  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1];
}

/**
 * **NOT CURRENTLY REGISTERED.** See `apps/api/src/app.ts` — this hook is
 * intentionally not attached to the Fastify instance yet. Every request is
 * unauthenticated today; the routing engine (`@shiproutesx/core`,
 * `@shiproutesx/graph`) never sees this module at all, imports it, or knows
 * it exists.
 *
 * This is the prepared location for the future `onRequest` hook that will
 * validate an API key on every request once real authentication ships (see
 * docs/platform-architecture.md for the full planned flow):
 *
 *  1. Extract the raw key from the `Authorization: Bearer <key>` header.
 *  2. Ask the configured `Authenticator` to authenticate it.
 *  3. If not authenticated, reply `401` and stop the request here.
 *  4. Otherwise attach the resulting `AuthContext` to `request.auth`, so
 *     later hooks (rate limiting, usage tracking) and route handlers can
 *     read who's calling without re-authenticating.
 *
 * To enable it once ready: `app.addHook('onRequest', apiKeyAuthMiddleware)`
 * in `apps/api/src/app.ts`.
 */
export async function apiKeyAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = extractApiKey(request);
  const context = await authenticator.authenticate(apiKey);

  if (!context.authenticated) {
    await reply.status(401).send({ error: 'Missing or invalid API key', code: 'UNAUTHENTICATED' });
    return;
  }

  request.auth = context;
}
