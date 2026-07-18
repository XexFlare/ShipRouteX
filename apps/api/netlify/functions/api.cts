// Netlify Function entry point — adapts the existing Fastify app
// (apps/api/src/app.ts) to a single Lambda-style invocation instead of a
// long-running `.listen()` server. This file is the ONLY new entry point;
// apps/api/src/index.ts (the `.listen()`-based local dev/`npm start`
// server) is untouched and keeps working exactly as before.
//
// Netlify bundles this file with esbuild (see apps/api/netlify.toml,
// `node_bundler = "esbuild"`), tracing every import — including the
// workspace packages, which are consumed from their TS source
// (`"main": "./src/index.ts"`) exactly as they are in dev. That bundling is
// why the two upstream fixes exist:
//   - apps/api/src/app.ts gates pino-pretty out of production (its
//     transport can't resolve once everything collapses into one file).
//   - packages/core/src/network-path.ts and
//     apps/api/src/routes/openapi.ts each support an env-var override
//     (SHIPROUTESX_DATA_DIR / SHIPROUTESX_OPENAPI_PATH) because their
//     default `import.meta.url`-relative climb assumes the real repo's
//     directory depth, which no longer holds once bundled. Both overrides
//     are set below, pointing at data staged next to this function by
//     apps/api/scripts/copy-netlify-assets.mjs (see netlify.toml's
//     `included_files`).
//
// This file is `.cts` (not `.mts`) deliberately: Fastify's dependency avvio
// does a dynamic `require()` internally, which throws
// "Dynamic require ... is not supported" when esbuild bundles it into a
// pure-ESM output — confirmed by actually bundling and running this
// function during this migration. `.cts` forces esbuild to bundle as
// CommonJS (which has a real `require`) regardless of the enclosing
// `"type": "module"` in apps/api/package.json. That's safe here because,
// unlike the code above, this file never relies on `import.meta.url`.
import path from 'node:path';
import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from '../../src/app';

// AWS Lambda (which Netlify Functions run on) always sets this to the
// directory containing the deployed function code — using it (rather than
// import.meta.url, which isn't available in this CommonJS bundle anyway)
// locates the data files staged alongside this function.
const functionDir = process.env['LAMBDA_TASK_ROOT'] ?? process.cwd();
const bundledDir = path.join(functionDir, '_bundled');

// `??=` so an explicit Netlify environment variable (Site settings >
// Environment variables) always wins over this best-effort default — see
// the deployment notes for this migration.
process.env['SHIPROUTESX_DATA_DIR'] ??= bundledDir;
process.env['SHIPROUTESX_OPENAPI_PATH'] ??= path.join(bundledDir, 'openapi.json');
process.env['NODE_ENV'] ??= 'production';

const app = buildApp();
const proxy = awsLambdaFastify(app);

// netlify.toml rewrites every request to /.netlify/functions/api/:splat so
// the API is reachable at clean paths (e.g. `/route`, not
// `/.netlify/functions/api/route`) on the custom domain. That rewrite means
// the event this function receives still carries the
// /.netlify/functions/api prefix in its path — strip it before Fastify ever
// sees it, since the app's own routes are registered at the clean paths.
const FUNCTION_PREFIX = '/.netlify/functions/api';

function stripFunctionPrefix(value: string | undefined): string | undefined {
  if (typeof value !== 'string' || !value.startsWith(FUNCTION_PREFIX)) return value;
  return value.slice(FUNCTION_PREFIX.length) || '/';
}

export const handler = async (event: Record<string, unknown>, context: unknown) => {
  if (typeof event['path'] === 'string') {
    event['path'] = stripFunctionPrefix(event['path']);
  }
  if (typeof event['rawPath'] === 'string') {
    event['rawPath'] = stripFunctionPrefix(event['rawPath']);
  }
  return proxy(event as never, context as never);
};
