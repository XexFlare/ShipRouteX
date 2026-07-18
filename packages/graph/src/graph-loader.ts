import { readFile } from 'node:fs/promises';

import { Edge } from './edge';
import { Graph } from './graph';
import { Node } from './node';
import {
  isResolutionKm,
  type NetworkData,
  type NetworkEdgeData,
  type NetworkNodeData,
} from './types';

export class GraphValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphValidationError';
  }
}

function isNetworkNodeData(value: unknown): value is NetworkNodeData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'string' && typeof v['lon'] === 'number' && typeof v['lat'] === 'number'
  );
}

function isNetworkEdgeData(value: unknown): value is NetworkEdgeData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'string' &&
    typeof v['from'] === 'string' &&
    typeof v['to'] === 'string' &&
    typeof v['distanceKm'] === 'number' &&
    (v['pass'] === undefined || v['pass'] === null || typeof v['pass'] === 'string')
  );
}

function isNetworkData(value: unknown): value is NetworkData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isResolutionKm(v['resolutionKm']) &&
    Array.isArray(v['nodes']) &&
    v['nodes'].every(isNetworkNodeData) &&
    Array.isArray(v['edges']) &&
    v['edges'].every(isNetworkEdgeData)
  );
}

/**
 * Builds an immutable `Graph` from raw network data, validating structural
 * integrity (unique ids, no dangling edge references, positive distances)
 * before any `Graph` instance is created.
 */
export class GraphLoader {
  /** Parse and validate already-in-memory network data into a Graph. */
  static fromData(data: NetworkData): Graph {
    const nodes: Node[] = [];
    const seenNodeIds = new Set<string>();

    for (const raw of data.nodes) {
      if (seenNodeIds.has(raw.id)) {
        throw new GraphValidationError(`Duplicate node id: "${raw.id}"`);
      }
      seenNodeIds.add(raw.id);
      nodes.push(new Node(raw));
    }

    const edges: Edge[] = [];
    const seenEdgeIds = new Set<string>();

    for (const raw of data.edges) {
      if (seenEdgeIds.has(raw.id)) {
        throw new GraphValidationError(`Duplicate edge id: "${raw.id}"`);
      }
      if (!seenNodeIds.has(raw.from)) {
        throw new GraphValidationError(`Edge "${raw.id}" references unknown node: "${raw.from}"`);
      }
      if (!seenNodeIds.has(raw.to)) {
        throw new GraphValidationError(`Edge "${raw.id}" references unknown node: "${raw.to}"`);
      }
      if (!(raw.distanceKm > 0)) {
        throw new GraphValidationError(
          `Edge "${raw.id}" has a non-positive distanceKm: ${raw.distanceKm}`,
        );
      }
      seenEdgeIds.add(raw.id);
      edges.push(new Edge(raw));
    }

    return new Graph(data.resolutionKm, nodes, edges);
  }

  /** Read a network data JSON file from disk and build a Graph from it. */
  static async fromFile(filePath: string): Promise<Graph> {
    let raw: string;
    try {
      raw = await readFile(filePath, 'utf-8');
    } catch (error) {
      throw new GraphValidationError(
        `Could not read network file: ${filePath} (${error instanceof Error ? error.message : String(error)})`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new GraphValidationError(`Could not parse network file as JSON: ${filePath}`);
    }

    if (!isNetworkData(parsed)) {
      throw new GraphValidationError(
        `Network file does not match the expected schema: ${filePath}`,
      );
    }

    return GraphLoader.fromData(parsed);
  }
}
