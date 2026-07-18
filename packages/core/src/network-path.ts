import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ResolutionKm } from '@shiproutesx/graph';

/**
 * The `data/` directory, resolved relative to this file's real location
 * (`packages/core/src` in dev, `packages/core/dist` once built — both sit
 * at the same depth under `packages/core`, so the climb is the same either
 * way). Overridable via `SHIPROUTESX_DATA_DIR` for deployments where the
 * repo layout isn't available on disk (e.g. a serverless bundle).
 */
function dataDir(): string {
  const envOverride = process.env['SHIPROUTESX_DATA_DIR'];
  if (envOverride) return envOverride;

  const thisFileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(thisFileDir, '../../../data');
}

/** Absolute path to the network data file for a given resolution. */
export function resolveNetworkFilePath(resolutionKm: ResolutionKm): string {
  return path.join(dataDir(), 'networks', `${resolutionKm}km.json`);
}
