// Stages the files the Netlify Function needs at runtime (the routing
// network JSON + openapi.json) inside apps/api/netlify/functions/_bundled/,
// co-located with the function entry point. esbuild's function bundler
// (Netlify's `node_bundler = "esbuild"`) only traces JS/TS imports — it
// won't pick up arbitrary data files on its own, so `included_files` in
// netlify.toml points at this staged copy instead of reaching across the
// monorepo to packages/core or data/. Paths are resolved from this script's
// own location so it behaves the same regardless of the shell's cwd.
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(apiDir, '../..');

const bundledDir = path.join(apiDir, 'netlify', 'functions', '_bundled');
const networksOutDir = path.join(bundledDir, 'networks');

const resolutions = ['20km', '50km', '100km'];

async function main() {
  await mkdir(networksOutDir, { recursive: true });

  for (const resolution of resolutions) {
    const src = path.join(repoRoot, 'data', 'networks', `${resolution}.json`);
    const dest = path.join(networksOutDir, `${resolution}.json`);
    await copyFile(src, dest);
    console.log(`Copied ${path.relative(repoRoot, src)} -> ${path.relative(repoRoot, dest)}`);
  }

  const openApiSrc = path.join(repoRoot, 'openapi.json');
  const openApiDest = path.join(bundledDir, 'openapi.json');
  await copyFile(openApiSrc, openApiDest);
  console.log(`Copied ${path.relative(repoRoot, openApiSrc)} -> ${path.relative(repoRoot, openApiDest)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
