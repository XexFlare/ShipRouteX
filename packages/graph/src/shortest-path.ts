import type { Edge } from './edge';
import type { Graph } from './graph';
import { MinHeap } from './min-heap';

/** Assigns a weight to an edge for shortest-path purposes. Must be non-negative. */
export type EdgeWeightFn = (edge: Edge) => number;

export interface ShortestPathResult {
  /** Node ids from start to end, inclusive. */
  nodeIds: readonly string[];
  /** Edge ids used, in traversal order — one shorter than `nodeIds`. */
  edgeIds: readonly string[];
  /** Sum of `weight(edge)` over `edgeIds`. */
  totalWeight: number;
}

interface HeapEntry {
  nodeId: string;
  distance: number;
}

/**
 * Dijkstra's algorithm over a `Graph`, with a caller-supplied edge weight
 * function. Returns the shortest path between two nodes, or `null` if either
 * node doesn't exist in the graph or no path connects them.
 *
 * This is a from-scratch, dependency-free implementation with no maritime
 * domain knowledge — the weight function (e.g. distance, or distance with
 * some edges blocked via `Infinity`) is entirely the caller's concern.
 *
 * Uses a binary min-heap (`MinHeap`) as its priority queue with the standard
 * "lazy deletion" pattern (a node may be pushed more than once as shorter
 * distances are discovered; stale, already-settled entries are skipped when
 * popped rather than removed eagerly) — `O((V + E) log V)` rather than the
 * `O(V^2)` of repeatedly scanning every unvisited node for the minimum.
 */
export function findShortestPath(
  graph: Graph,
  startNodeId: string,
  endNodeId: string,
  weight: EdgeWeightFn,
): ShortestPathResult | null {
  if (!graph.hasNode(startNodeId) || !graph.hasNode(endNodeId)) return null;

  if (startNodeId === endNodeId) {
    return { nodeIds: [startNodeId], edgeIds: [], totalWeight: 0 };
  }

  const distanceById = new Map<string, number>([[startNodeId, 0]]);
  const previousNodeById = new Map<string, string>();
  const previousEdgeById = new Map<string, string>();
  const settled = new Set<string>();

  const queue = new MinHeap<HeapEntry>((entry) => entry.distance);
  queue.push({ nodeId: startNodeId, distance: 0 });

  while (!queue.isEmpty()) {
    const current = queue.pop()!;

    // Stale entry: this node was already settled with a distance at least
    // this good (it was pushed again earlier via a shorter relaxation, or
    // this is an outdated copy from before a shorter one was found).
    if (settled.has(current.nodeId)) continue;
    if (current.distance > (distanceById.get(current.nodeId) ?? Infinity)) continue;

    settled.add(current.nodeId);
    if (current.nodeId === endNodeId) break;

    for (const edgeId of graph.incidentEdgeIds(current.nodeId)) {
      const edge = graph.getEdge(edgeId);
      if (!edge) continue;

      const neighborId = edge.otherNodeId(current.nodeId);
      if (settled.has(neighborId)) continue;

      const candidateDistance = current.distance + weight(edge);
      if (candidateDistance < (distanceById.get(neighborId) ?? Infinity)) {
        distanceById.set(neighborId, candidateDistance);
        previousNodeById.set(neighborId, current.nodeId);
        previousEdgeById.set(neighborId, edgeId);
        queue.push({ nodeId: neighborId, distance: candidateDistance });
      }
    }
  }

  const totalWeight = distanceById.get(endNodeId);
  if (totalWeight === undefined || totalWeight === Infinity) return null;

  return {
    ...reconstructPath(startNodeId, endNodeId, previousNodeById, previousEdgeById),
    totalWeight,
  };
}

function reconstructPath(
  startNodeId: string,
  endNodeId: string,
  previousNodeById: ReadonlyMap<string, string>,
  previousEdgeById: ReadonlyMap<string, string>,
): Pick<ShortestPathResult, 'nodeIds' | 'edgeIds'> {
  const nodeIds: string[] = [endNodeId];
  const edgeIds: string[] = [];

  let cursor = endNodeId;
  while (cursor !== startNodeId) {
    const previousNodeId = previousNodeById.get(cursor);
    const previousEdgeId = previousEdgeById.get(cursor);
    if (previousNodeId === undefined || previousEdgeId === undefined) {
      // Unreachable in practice: totalWeight was finite, so a predecessor
      // chain back to startNodeId must exist.
      throw new Error(`Could not reconstruct path back to "${startNodeId}" from "${endNodeId}"`);
    }

    edgeIds.unshift(previousEdgeId);
    nodeIds.unshift(previousNodeId);
    cursor = previousNodeId;
  }

  return { nodeIds, edgeIds };
}
