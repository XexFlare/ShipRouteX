import type { ResolutionKm } from '@shiproutesx/graph';

/**
 * Named straits, canals, and passages the maritime network can tag edges
 * with (see docs/searoute-architecture-analysis.md, §5). Only a few of
 * these appear in the current starter network's data (see
 * `data/networks/20km.json`) — the full list is modeled now so
 * `RouteOptions.avoid` is forward-compatible as more of the network is
 * tagged, without another breaking change to this type later.
 */
export const PASS_NAMES = [
  'suez',
  'panama',
  'malacca',
  'gibraltar',
  'dover',
  'bering',
  'magellan',
  'babelmandeb',
  'kiel',
  'corinth',
  'northwest',
  'northeast',
] as const;

export type PassName = (typeof PASS_NAMES)[number];

export function isPassName(value: unknown): value is PassName {
  return typeof value === 'string' && (PASS_NAMES as readonly string[]).includes(value);
}

/**
 * Configuration for a single route computation.
 *
 * Deliberately a single typed options object rather than one boolean
 * parameter per strait — SeaRoute's Java implementation took 12 boolean
 * parameters (`allowSuez`, `allowPanama`, ...) on `getRoute`, a pattern this
 * project's own architecture analysis flagged as worth redesigning (see
 * docs/searoute-architecture-analysis.md, §17.4).
 */
export interface RouteOptions {
  /**
   * Named straits/canals/passages to avoid entirely — any edge tagged with
   * one of these becomes impassable for this route. Defaults to `[]`
   * (nothing avoided). Order and duplicates don't matter; the computed
   * route echoes back a deduplicated, sorted list in its metadata.
   */
  avoid?: PassName[];

  /**
   * Network resolution to route over. Defaults to `DEFAULT_RESOLUTION_KM`.
   *
   * `computeRoute` uses this to decide which resolution's graph to load
   * (loading/caching it on demand — see `loadMaritimeGraph`). `calculateRoute`
   * takes an already-loaded `Graph` directly and, if this is also set,
   * only uses it to double-check it matches that graph's own resolution.
   */
  resolutionKm?: ResolutionKm;
}
