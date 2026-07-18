import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyPluginAsync } from 'fastify';

/**
 * `openapi.json` lives at the repo root (see docs/api.md and
 * docs/development.md) — this resolves to it relative to this file's real
 * location, which sits at the same depth under `dist/` once built as it
 * does under `src/` today, so the climb is identical in dev and in a built
 * `node dist/index.js` run. Overridable via `SHIPROUTESX_OPENAPI_PATH` for
 * deployments where the repo layout isn't available on disk (e.g. a
 * serverless bundle) — mirrors `SHIPROUTESX_DATA_DIR` in
 * packages/core/src/network-path.ts.
 */
function resolveOpenApiSpecPath(): string {
  const envOverride = process.env['SHIPROUTESX_OPENAPI_PATH'];
  if (envOverride) return envOverride;

  const thisFileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(thisFileDir, '../../../../openapi.json');
}

/**
 * `GET /openapi.json` — serves this API's hand-maintained OpenAPI 3.1 spec
 * as-is from disk. Not generated from route schemas (this API validates
 * requests with plain type guards, not JSON Schema) — see
 * docs/development.md for the expectation that changing a route's request
 * or response shape means updating `openapi.json` alongside it.
 */
export const openApiRoute: FastifyPluginAsync = async (app) => {
  app.get('/openapi.json', async (_request, reply) => {
    const raw = await readFile(resolveOpenApiSpecPath(), 'utf-8');
    reply.type('application/json');
    return raw;
  });
};
