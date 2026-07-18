import { Edge } from './edge';
import { Node } from './node';
import { formatResolution, type ResolutionKm } from './types';

export interface GraphSummary {
  resolutionKm: ResolutionKm;
  resolutionLabel: string;
  nodeCount: number;
  edgeCount: number;
}

/**
 * An immutable, in-memory network graph.
 *
 * Built once (by `GraphLoader`) from a fixed list of nodes and edges.
 * Adjacency is precomputed at construction time so neighbor lookups never
 * mutate or lazily recompute internal state afterward — once built, a
 * `Graph` never changes.
 */
export class Graph {
  readonly resolutionKm: ResolutionKm;

  private readonly nodesById: ReadonlyMap<string, Node>;
  private readonly edgesById: ReadonlyMap<string, Edge>;
  private readonly incidentEdgeIdsByNodeId: ReadonlyMap<string, readonly string[]>;

  constructor(resolutionKm: ResolutionKm, nodes: readonly Node[], edges: readonly Edge[]) {
    this.resolutionKm = resolutionKm;

    const nodesById = new Map<string, Node>();
    for (const node of nodes) nodesById.set(node.id, node);

    const incident = new Map<string, string[]>();
    for (const node of nodes) incident.set(node.id, []);

    const edgesById = new Map<string, Edge>();
    for (const edge of edges) {
      edgesById.set(edge.id, edge);
      incident.get(edge.fromNodeId)?.push(edge.id);
      incident.get(edge.toNodeId)?.push(edge.id);
    }

    this.nodesById = nodesById;
    this.edgesById = edgesById;
    this.incidentEdgeIdsByNodeId = incident;

    Object.freeze(this);
  }

  get nodeCount(): number {
    return this.nodesById.size;
  }

  get edgeCount(): number {
    return this.edgesById.size;
  }

  get resolutionLabel(): string {
    return formatResolution(this.resolutionKm);
  }

  getNode(id: string): Node | undefined {
    return this.nodesById.get(id);
  }

  getEdge(id: string): Edge | undefined {
    return this.edgesById.get(id);
  }

  hasNode(id: string): boolean {
    return this.nodesById.has(id);
  }

  /** Ids of edges incident to a node, in either direction. */
  incidentEdgeIds(nodeId: string): readonly string[] {
    return this.incidentEdgeIdsByNodeId.get(nodeId) ?? [];
  }

  nodes(): IterableIterator<Node> {
    return this.nodesById.values();
  }

  edges(): IterableIterator<Edge> {
    return this.edgesById.values();
  }

  summary(): GraphSummary {
    return {
      resolutionKm: this.resolutionKm,
      resolutionLabel: this.resolutionLabel,
      nodeCount: this.nodeCount,
      edgeCount: this.edgeCount,
    };
  }
}
