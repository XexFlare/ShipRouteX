import type { NetworkEdgeData } from './types';

/**
 * A connection between two nodes. Immutable once constructed.
 *
 * `fromNodeId`/`toNodeId` preserve the direction the data was authored in,
 * but the graph traverses edges in both directions (real shipping lanes are
 * bidirectional) — see `Graph.incidentEdgeIds`.
 */
export class Edge {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly distanceKm: number;
  /** Name of the strait/canal/passage this edge transits, if any (e.g. "suez"). */
  readonly pass: string | null;

  constructor(data: NetworkEdgeData) {
    this.id = data.id;
    this.fromNodeId = data.from;
    this.toNodeId = data.to;
    this.distanceKm = data.distanceKm;
    this.pass = data.pass ?? null;
    Object.freeze(this);
  }

  /** The id of the node on the other end of this edge from `nodeId`. */
  otherNodeId(nodeId: string): string {
    return nodeId === this.fromNodeId ? this.toNodeId : this.fromNodeId;
  }
}
