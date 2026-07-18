import { describe, expect, it } from 'vitest';
import { Edge } from './edge';
import { Graph } from './graph';
import { Node } from './node';

function buildTriangleGraph(): Graph {
  const nodes = [
    new Node({ id: 'a', lon: 0, lat: 0 }),
    new Node({ id: 'b', lon: 1, lat: 0 }),
    new Node({ id: 'c', lon: 0, lat: 1 }),
  ];
  const edges = [
    new Edge({ id: 'e1', from: 'a', to: 'b', distanceKm: 111 }),
    new Edge({ id: 'e2', from: 'b', to: 'c', distanceKm: 157, pass: 'suez' }),
    new Edge({ id: 'e3', from: 'c', to: 'a', distanceKm: 111 }),
  ];
  return new Graph(20, nodes, edges);
}

describe('Graph', () => {
  it('reports node and edge counts', () => {
    const graph = buildTriangleGraph();

    expect(graph.nodeCount).toBe(3);
    expect(graph.edgeCount).toBe(3);
  });

  it('formats a resolution label', () => {
    const graph = buildTriangleGraph();

    expect(graph.resolutionKm).toBe(20);
    expect(graph.resolutionLabel).toBe('20km');
  });

  it('looks up nodes and edges by id', () => {
    const graph = buildTriangleGraph();

    expect(graph.getNode('a')?.lon).toBe(0);
    expect(graph.getNode('missing')).toBeUndefined();
    expect(graph.getEdge('e2')?.pass).toBe('suez');
    expect(graph.getEdge('missing')).toBeUndefined();
    expect(graph.hasNode('a')).toBe(true);
    expect(graph.hasNode('missing')).toBe(false);
  });

  it('computes incident edges for both directions of an edge', () => {
    const graph = buildTriangleGraph();

    expect([...graph.incidentEdgeIds('a')].sort()).toEqual(['e1', 'e3']);
    expect([...graph.incidentEdgeIds('b')].sort()).toEqual(['e1', 'e2']);
    expect([...graph.incidentEdgeIds('c')].sort()).toEqual(['e2', 'e3']);
    expect(graph.incidentEdgeIds('missing')).toEqual([]);
  });

  it('iterates all nodes and edges', () => {
    const graph = buildTriangleGraph();

    expect(Array.from(graph.nodes(), (n) => n.id).sort()).toEqual(['a', 'b', 'c']);
    expect(Array.from(graph.edges(), (e) => e.id).sort()).toEqual(['e1', 'e2', 'e3']);
  });

  it('summarizes itself', () => {
    const graph = buildTriangleGraph();

    expect(graph.summary()).toEqual({
      resolutionKm: 20,
      resolutionLabel: '20km',
      nodeCount: 3,
      edgeCount: 3,
    });
  });

  it('is immutable', () => {
    const graph = buildTriangleGraph();

    expect(() => {
      (graph as { resolutionKm: number }).resolutionKm = 5;
    }).toThrow();
  });
});
