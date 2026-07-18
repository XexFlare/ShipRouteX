import { Graph, GraphCache, GraphLoader, type ResolutionKm } from '@shiproutesx/graph';

import { resolveNetworkFilePath } from './network-path';

/** The resolution ShipRoutesX loads by default when none is specified. */
export const DEFAULT_RESOLUTION_KM: ResolutionKm = 20;

/**
 * Module-level singleton — every caller within this process shares the same
 * cache, so the maritime network for a given resolution is loaded exactly
 * once for the process's lifetime, however many times `loadMaritimeGraph`
 * is called (Node caches ES module instances, which is what makes this a
 * true process-wide singleton rather than a per-import cache).
 */
const cache = new GraphCache();

/**
 * Loads the maritime network graph for a resolution, from cache if it has
 * already been loaded. Safe to call concurrently — concurrent calls for the
 * same not-yet-loaded resolution share a single load.
 */
export async function loadMaritimeGraph(
  resolutionKm: ResolutionKm = DEFAULT_RESOLUTION_KM,
): Promise<Graph> {
  return cache.getOrLoad(resolutionKm, () =>
    GraphLoader.fromFile(resolveNetworkFilePath(resolutionKm)),
  );
}

/**
 * The already-loaded graph for a resolution, or undefined if it hasn't
 * been loaded (via `loadMaritimeGraph`) yet. Never triggers a load itself.
 */
export function getLoadedMaritimeGraph(
  resolutionKm: ResolutionKm = DEFAULT_RESOLUTION_KM,
): Graph | undefined {
  return cache.getIfLoaded(resolutionKm);
}
