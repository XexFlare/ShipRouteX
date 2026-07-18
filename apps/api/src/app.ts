import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { rootRoute } from './routes/root';
import { healthRoute } from './routes/health';
import { graphStatsRoute } from './routes/graph';
import { routeRoute } from './routes/route';
import { openApiRoute } from './routes/openapi';

/**
 * Builds (but does not start) the Fastify instance. Kept separate from the
 * entrypoint so tests can build an app with `.inject()` without binding a
 * port. Routes only ever read from `@shiproutesx/core`'s public API (e.g.
 * `getLoadedMaritimeGraph`) — the HTTP layer stays a thin transport over the
 * routing engine, never reimplementing its logic.
 */
export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  // pino-pretty spawns a worker-thread transport that resolves its target
  // module from disk at startup — this works fine under `tsx`/`node
  // dist/index.js` but cannot resolve once the app is bundled into a single
  // file for Netlify Functions (there's no `node_modules/pino-pretty` next
  // to the bundle). Production/bundled runs get plain structured (JSON)
  // logging instead; local dev keeps the pretty transport.
  const isProduction = process.env['NODE_ENV'] === 'production';

  const app = Fastify({
    logger: isProduction
      ? true
      : {
          transport: {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        },
    ...opts,
  });

  // Future: app.addHook('onRequest', apiKeyAuthMiddleware) — NOT enabled
  // yet. See apps/api/src/middleware/api-key-auth.ts (the prepared,
  // not-yet-registered API-key validation hook) and
  // docs/platform-architecture.md (the planned end-to-end auth flow). Every
  // request is unauthenticated until this is switched on; the routing
  // engine below never sees auth state either way.

  app.register(rootRoute);
  app.register(healthRoute);
  app.register(graphStatsRoute);
  app.register(routeRoute);
  app.register(openApiRoute);

  return app;
}
