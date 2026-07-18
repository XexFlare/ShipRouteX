import { findShortestPath, type Edge, type Graph, type ResolutionKm } from '@shiproutesx/graph';
import { haversineKm, type Coordinate } from '@shiproutesx/shared';
import { NetworkUnavailableError, RouteNotFoundError, RouteValidationError } from './errors';
import { loadMaritimeGraph, DEFAULT_RESOLUTION_KM } from './maritime-network';
import { isPassName, PASS_NAMES, type PassName, type RouteOptions } from './route-options';

/** A GeoJSON LineString — coordinates are `[lon, lat]` pairs, per the GeoJSON spec. */
export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

/** Where a requested coordinate ended up snapped to on the maritime network. */
export interface SnapInfo {
  /** Graph node id the coordinate was snapped to. */
  nodeId: string;
  /** That node's actual position. */
  coordinate: Coordinate;
  /** Straight-line distance from the requested coordinate to `coordinate`, in km. */
  distanceKm: number;
}

export interface RouteMetadata {
  /** Network resolution the route was computed against. */
  resolutionKm: ResolutionKm;
  /** The (deduplicated, sorted) avoid list actually applied to this route. */
  avoid: PassName[];
  /** Named chokepoints actually traversed by the computed path, deduplicated and sorted. */
  passesUsed: string[];
  /** How the origin coordinate was snapped onto the network (nearest-node lookup result). */
  origin: SnapInfo;
  /** How the destination coordinate was snapped onto the network. */
  destination: SnapInfo;
  /** Wall-clock time spent inside `calculateRoute`, in milliseconds. */
  computeTimeMs: number;
}

export interface RouteResult {
  /** Total route distance in km: origin-to-node + shortest path + node-to-destination. */
  distanceKm: number;
  geometry: RouteGeometry;
  metadata: RouteMetadata;
}

export interface RouteRequest {
  origin: Coordinate;
  destination: Coordinate;
}

function assertValidCoordinate(coordinate: Coordinate, label: string): void {
  if (!Number.isFinite(coordinate.lat) || coordinate.lat < -90 || coordinate.lat > 90) {
    throw new RouteValidationError(`${label}.lat must be a finite number between -90 and 90`);
  }
  if (!Number.isFinite(coordinate.lon) || coordinate.lon < -180 || coordinate.lon > 180) {
    throw new RouteValidationError(`${label}.lon must be a finite number between -180 and 180`);
  }
}

/** Deduplicates and validates an avoid list, throwing on any unrecognized pass name. */
function normalizeAvoidList(avoid: PassName[] | undefined): PassName[] {
  if (!avoid || avoid.length === 0) return [];

  const unique = [...new Set(avoid)];
  const invalid = unique.filter((name) => !isPassName(name));
  if (invalid.length > 0) {
    throw new RouteValidationError(
      `Unknown pass name(s) in "avoid": ${invalid.join(', ')}. Valid names: ${PASS_NAMES.join(', ')}`,
    );
  }

  return unique.sort();
}

/**
 * Finds the graph node nearest a coordinate by a linear scan over every
 * node. Simple and correct, and entirely adequate for the network sizes
 * ShipRoutesX currently loads; see docs/searoute-architecture-analysis.md
 * (§13, §17.2) for the documented spatial-index upgrade path once the
 * network grows large enough for this to matter. (Dijkstra itself now uses
 * a binary heap — see `findShortestPath` — this is the one remaining
 * documented linear scan in the routing path.)
 */
function findNearestNode(graph: Graph, coordinate: Coordinate): SnapInfo {
  let nearestId: string | undefined;
  let nearestDistanceKm = Infinity;

  for (const node of graph.nodes()) {
    const distanceKm = haversineKm(coordinate, { lon: node.lon, lat: node.lat });
    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      nearestId = node.id;
    }
  }

  if (nearestId === undefined) {
    throw new RouteValidationError('The maritime network graph has no nodes to route through');
  }

  const node = graph.getNode(nearestId);
  if (!node) throw new Error(`Snapped to node "${nearestId}" but could not look it up`); // internal invariant

  return {
    nodeId: nearestId,
    coordinate: { lon: node.lon, lat: node.lat },
    distanceKm: nearestDistanceKm,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Computes a maritime route between two coordinates over an already-loaded
 * `Graph`, honoring `options.avoid` (edges tagged with an avoided pass
 * become impassable for this route).
 *
 * Steps:
 *  1. Validate the input coordinates and `options.avoid`.
 *  2. Snap the origin and destination to their nearest graph nodes
 *     (nearest-node lookup — recorded as `metadata.origin`/`.destination`,
 *     the route's "snapping information").
 *  3. Run Dijkstra's algorithm between those nodes, weighting each edge by
 *     its great-circle distance, with any edge tagged with an avoided pass
 *     weighted `Infinity` (shortest path + path reconstruction, delegated
 *     to `@shiproutesx/graph`'s `findShortestPath`).
 *  4. Sum the origin/destination snap distances with the path's own
 *     distance (distance calculation).
 *  5. Render the result as a single GeoJSON LineString (GeoJSON generation).
 *
 * Pure and synchronous: takes an already-loaded `Graph` rather than loading
 * one itself, so this function has no I/O and no framework dependency of
 * any kind — safe and fast to unit test with small fixture graphs, and
 * usable from any transport layer (HTTP, CLI, ...), not just Fastify. See
 * `computeRoute` for the higher-level async entry point that also resolves
 * *which* `Graph` to use from `options.resolutionKm`.
 *
 * @throws {RouteValidationError} invalid coordinates, an unknown name in
 * `options.avoid`, or `options.resolutionKm` disagreeing with `graph`'s.
 * @throws {RouteNotFoundError} the snapped origin/destination aren't
 * connected (including "connected only through an avoided pass").
 */
export function calculateRoute(
  graph: Graph,
  request: RouteRequest,
  options: RouteOptions = {},
): RouteResult {
  const startedAt = performance.now();

  assertValidCoordinate(request.origin, 'origin');
  assertValidCoordinate(request.destination, 'destination');

  if (options.resolutionKm !== undefined && options.resolutionKm !== graph.resolutionKm) {
    throw new RouteValidationError(
      `options.resolutionKm (${options.resolutionKm}km) does not match the provided graph's resolution (${graph.resolutionKm}km)`,
    );
  }

  const avoid = normalizeAvoidList(options.avoid);
  const avoidSet = new Set<string>(avoid);

  const origin = findNearestNode(graph, request.origin);
  const destination = findNearestNode(graph, request.destination);

  const path = findShortestPath(graph, origin.nodeId, destination.nodeId, (edge: Edge) =>
    edge.pass && avoidSet.has(edge.pass) ? Infinity : edge.distanceKm,
  );

  if (!path) {
    throw new RouteNotFoundError(
      avoid.length > 0
        ? `No path found between "${origin.nodeId}" and "${destination.nodeId}" while avoiding: ${avoid.join(', ')}`
        : `No path found between "${origin.nodeId}" and "${destination.nodeId}"`,
    );
  }

  const passesUsed = [
    ...new Set(
      path.edgeIds
        .map((edgeId) => graph.getEdge(edgeId)?.pass)
        .filter((pass): pass is string => Boolean(pass)),
    ),
  ].sort();

  const pathCoordinates: [number, number][] = path.nodeIds.map((nodeId) => {
    const node = graph.getNode(nodeId);
    if (!node) throw new Error(`Path referenced an unknown node: "${nodeId}"`); // internal invariant, not user-facing
    return [node.lon, node.lat];
  });

  const geometry: RouteGeometry = {
    type: 'LineString',
    coordinates: [
      [request.origin.lon, request.origin.lat],
      ...pathCoordinates,
      [request.destination.lon, request.destination.lat],
    ],
  };

  const distanceKm = round1(origin.distanceKm + path.totalWeight + destination.distanceKm);
  const computeTimeMs = round2(performance.now() - startedAt);

  return {
    distanceKm,
    geometry,
    metadata: {
      resolutionKm: graph.resolutionKm,
      avoid,
      passesUsed,
      origin: { ...origin, distanceKm: round1(origin.distanceKm) },
      destination: { ...destination, distanceKm: round1(destination.distanceKm) },
      computeTimeMs,
    },
  };
}

/**
 * Async, higher-level entry point: resolves *which* `Graph` to route over
 * from `options.resolutionKm` (defaulting to `DEFAULT_RESOLUTION_KM`),
 * loading/caching it via `loadMaritimeGraph` if it isn't already in memory
 * (see `GraphCache` — this loads a given resolution at most once per
 * process, however many routes are computed against it), then delegates to
 * `calculateRoute`. This is what `apps/api`'s `POST /route` handler calls.
 *
 * @throws {NetworkUnavailableError} no network data file exists for the
 * requested resolution.
 * @throws {RouteValidationError} see `calculateRoute`.
 * @throws {RouteNotFoundError} see `calculateRoute`.
 */
export async function computeRoute(
  request: RouteRequest,
  options: RouteOptions = {},
): Promise<RouteResult> {
  const resolutionKm = options.resolutionKm ?? DEFAULT_RESOLUTION_KM;

  let graph: Graph;
  try {
    graph = await loadMaritimeGraph(resolutionKm);
  } catch (cause) {
    throw new NetworkUnavailableError(
      `No maritime network data available for resolution ${resolutionKm}km`,
      {
        cause,
      },
    );
  }

  return calculateRoute(graph, request, options);
}
