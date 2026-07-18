/**
 * Generic weighted-graph primitives and loading/caching infrastructure.
 *
 * This package is intentionally maritime-agnostic: it knows how to build,
 * validate, and cache a graph of nodes and edges from data, but nothing here
 * encodes shipping-lane rules (chokepoint avoidance, antimeridian handling,
 * shortest-path weighting). That domain logic belongs in `@shiproutesx/core`,
 * which loads the actual maritime network through this package.
 */

export { Node } from './node';
export { Edge } from './edge';
export { Graph, type GraphSummary } from './graph';
export { GraphLoader, GraphValidationError } from './graph-loader';
export { GraphCache } from './graph-cache';
export { findShortestPath, type EdgeWeightFn, type ShortestPathResult } from './shortest-path';
export { MinHeap } from './min-heap';
export {
  RESOLUTIONS_KM,
  type ResolutionKm,
  isResolutionKm,
  formatResolution,
  type NetworkData,
  type NetworkNodeData,
  type NetworkEdgeData,
} from './types';
