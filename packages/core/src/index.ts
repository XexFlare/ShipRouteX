/**
 * ShipRoutesX routing engine — domain logic for computing maritime routes.
 *
 * This package is deliberately independent of any HTTP framework: `apps/api`
 * is the only place Fastify is imported. `core` owns network loading (from
 * `data/`) on top of the generic primitives in `@shiproutesx/graph`, and
 * exposes `calculateRoute` (pure/sync) and `computeRoute` (async, resolves
 * which resolution's graph to use) as its two entry points for computing a
 * route.
 *
 * Not implemented yet: antimeridian handling, and a spatial index for
 * nearest-node lookups (currently a documented linear scan) — see
 * docs/searoute-architecture-analysis.md.
 */

export { type Coordinate } from '@shiproutesx/shared';
export {
  type Graph,
  type GraphSummary,
  type ResolutionKm,
  RESOLUTIONS_KM,
  isResolutionKm,
} from '@shiproutesx/graph';

export {
  loadMaritimeGraph,
  getLoadedMaritimeGraph,
  DEFAULT_RESOLUTION_KM,
} from './maritime-network';

export { PASS_NAMES, isPassName, type PassName, type RouteOptions } from './route-options';

export {
  RouteCalculationError,
  RouteValidationError,
  RouteNotFoundError,
  NetworkUnavailableError,
} from './errors';

export {
  calculateRoute,
  computeRoute,
  type RouteRequest,
  type RouteResult,
  type RouteGeometry,
  type RouteMetadata,
  type SnapInfo,
} from './route';
