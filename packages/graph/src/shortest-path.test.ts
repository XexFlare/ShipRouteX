import { describe, expect, it } from 'vitest';
import { Edge } from './edge';
import { Graph } from './graph';
import { Node } from './node';
import { findShortestPath } from './shortest-path';

const byDistance = (edge: Edge): number => edge.distanceKm;

describe('findShortestPath', () => {
  it('returns a trivial path when start equals end', () => {
    const graph = new Graph(20, [new Node({ id: 'a', lon: 0, lat: 0 })], []);

    const result = findShortestPath(graph, 'a', 'a', byDistance);

    expect(result).toEqual({ nodeIds: ['a'], edgeIds: [], totalWeight: 0 });
  });

  it('returns null when either node is missing from the graph', () => {
    const graph = new Graph(20, [new Node({ id: 'a', lon: 0, lat: 0 })], []);

    expect(findShortestPath(graph, 'a', 'missing', byDistance)).toBeNull();
    expect(findShortestPath(graph, 'missing', 'a', byDistance)).toBeNull();
  });

  it('returns null when no path connects the two nodes', () => {
    const graph = new Graph(
      20,
      [new Node({ id: 'a', lon: 0, lat: 0 }), new Node({ id: 'b', lon: 1, lat: 1 })],
      [],
    );

    expect(findShortestPath(graph, 'a', 'b', byDistance)).toBeNull();
  });

  it('walks a simple chain and reconstructs the full path', () => {
    const graph = new Graph(
      20,
      [
        new Node({ id: 'a', lon: 0, lat: 0 }),
        new Node({ id: 'b', lon: 1, lat: 0 }),
        new Node({ id: 'c', lon: 2, lat: 0 }),
      ],
      [
        new Edge({ id: 'ab', from: 'a', to: 'b', distanceKm: 10 }),
        new Edge({ id: 'bc', from: 'b', to: 'c', distanceKm: 15 }),
      ],
    );

    const result = findShortestPath(graph, 'a', 'c', byDistance);

    expect(result).toEqual({
      nodeIds: ['a', 'b', 'c'],
      edgeIds: ['ab', 'bc'],
      totalWeight: 25,
    });
  });

  it('prefers the lower-total-weight path, not the fewest hops', () => {
    // a -> d direct (100) vs a -> b -> c -> d (10 + 10 + 10 = 30)
    const graph = new Graph(
      20,
      [
        new Node({ id: 'a', lon: 0, lat: 0 }),
        new Node({ id: 'b', lon: 1, lat: 0 }),
        new Node({ id: 'c', lon: 2, lat: 0 }),
        new Node({ id: 'd', lon: 3, lat: 0 }),
      ],
      [
        new Edge({ id: 'ad', from: 'a', to: 'd', distanceKm: 100 }),
        new Edge({ id: 'ab', from: 'a', to: 'b', distanceKm: 10 }),
        new Edge({ id: 'bc', from: 'b', to: 'c', distanceKm: 10 }),
        new Edge({ id: 'cd', from: 'c', to: 'd', distanceKm: 10 }),
      ],
    );

    const result = findShortestPath(graph, 'a', 'd', byDistance);

    expect(result?.nodeIds).toEqual(['a', 'b', 'c', 'd']);
    expect(result?.totalWeight).toBe(30);
  });

  it('traverses edges in both directions regardless of authored from/to', () => {
    const graph = new Graph(
      20,
      [new Node({ id: 'a', lon: 0, lat: 0 }), new Node({ id: 'b', lon: 1, lat: 0 })],
      [new Edge({ id: 'ab', from: 'b', to: 'a', distanceKm: 42 })],
    );

    const result = findShortestPath(graph, 'a', 'b', byDistance);

    expect(result).toEqual({ nodeIds: ['a', 'b'], edgeIds: ['ab'], totalWeight: 42 });
  });

  it('routes around an edge the weight function makes impassable', () => {
    // Direct a-c edge is shortest by distance, but the weight function
    // blocks it entirely (simulating e.g. a closed chokepoint) — the
    // algorithm must fall back to the longer a-b-c path.
    const graph = new Graph(
      20,
      [
        new Node({ id: 'a', lon: 0, lat: 0 }),
        new Node({ id: 'b', lon: 1, lat: 0 }),
        new Node({ id: 'c', lon: 2, lat: 0 }),
      ],
      [
        new Edge({ id: 'ac', from: 'a', to: 'c', distanceKm: 5, pass: 'blocked' }),
        new Edge({ id: 'ab', from: 'a', to: 'b', distanceKm: 10 }),
        new Edge({ id: 'bc', from: 'b', to: 'c', distanceKm: 10 }),
      ],
    );

    const blockPass = (edge: Edge): number =>
      edge.pass === 'blocked' ? Infinity : edge.distanceKm;
    const result = findShortestPath(graph, 'a', 'c', blockPass);

    expect(result?.nodeIds).toEqual(['a', 'b', 'c']);
    expect(result?.totalWeight).toBe(20);
  });
});
