import { Edge, Graph, Node } from '@shiproutesx/graph';
import { describe, expect, it } from 'vitest';
import { RouteNotFoundError, RouteValidationError } from './errors';
import { loadMaritimeGraph } from './maritime-network';
import { calculateRoute, computeRoute } from './route';

describe('calculateRoute — known routes over the real seed network', () => {
  it('routes Marseille to Shanghai via the Suez Canal, Bab-el-Mandeb, and Malacca', async () => {
    const graph = await loadMaritimeGraph();

    const result = calculateRoute(graph, {
      origin: { lon: 5.3, lat: 43.3 }, // marseille
      destination: { lon: 121.8, lat: 31.2 }, // shanghai
    });

    expect(result.metadata.origin.nodeId).toBe('marseille');
    expect(result.metadata.destination.nodeId).toBe('shanghai');
    expect(result.metadata.origin.distanceKm).toBe(0);
    expect(result.metadata.destination.distanceKm).toBe(0);
    expect(result.metadata.origin.coordinate).toEqual({ lon: 5.3, lat: 43.3 });
    expect(result.distanceKm).toBeCloseTo(15728.3, 1);
    expect(result.metadata.avoid).toEqual([]);
    expect(result.metadata.passesUsed).toEqual(['babelmandeb', 'malacca', 'suez']);
    expect(result.metadata.computeTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.metadata.resolutionKm).toBe(20);

    expect(result.geometry.type).toBe('LineString');
    expect(result.geometry.coordinates[0]).toEqual([5.3, 43.3]);
    expect(result.geometry.coordinates.at(-1)).toEqual([121.8, 31.2]);
  });

  it('routes around the Suez Canal via Cape of Good Hope when avoid: ["suez"] is set', async () => {
    const graph = await loadMaritimeGraph();

    const result = calculateRoute(
      graph,
      { origin: { lon: 5.3, lat: 43.3 }, destination: { lon: 121.8, lat: 31.2 } },
      { avoid: ['suez'] },
    );

    expect(result.metadata.avoid).toEqual(['suez']);
    expect(result.metadata.passesUsed).toEqual(['malacca']);
    expect(result.distanceKm).toBeCloseTo(26799.5, 1);
  });

  it('deduplicates and sorts the avoid list it echoes back in metadata', async () => {
    const graph = await loadMaritimeGraph();

    const result = calculateRoute(
      graph,
      { origin: { lon: 5.3, lat: 43.3 }, destination: { lon: 121.8, lat: 31.2 } },
      { avoid: ['panama', 'suez', 'panama'] },
    );

    expect(result.metadata.avoid).toEqual(['panama', 'suez']);
  });

  it('routes Los Angeles to New York via the Panama Canal', async () => {
    const graph = await loadMaritimeGraph();

    const result = calculateRoute(graph, {
      origin: { lon: -118.25, lat: 33.7 }, // losAngeles
      destination: { lon: -74.0, lat: 40.7 }, // newYork
    });

    expect(result.metadata.origin.nodeId).toBe('losAngeles');
    expect(result.metadata.destination.nodeId).toBe('newYork');
    expect(result.distanceKm).toBeCloseTo(8374.2, 1);
    expect(result.metadata.passesUsed).toEqual(['panama']);
  });

  it('still finds a (much longer) route around the world when avoiding Panama, since the seed network forms one loop', async () => {
    const graph = await loadMaritimeGraph();

    const direct = calculateRoute(graph, {
      origin: { lon: -118.25, lat: 33.7 }, // losAngeles
      destination: { lon: -74.0, lat: 40.7 }, // newYork
    });
    const avoidingPanama = calculateRoute(
      graph,
      { origin: { lon: -118.25, lat: 33.7 }, destination: { lon: -74.0, lat: 40.7 } },
      { avoid: ['panama'] },
    );

    expect(avoidingPanama.metadata.passesUsed).not.toContain('panama');
    expect(avoidingPanama.distanceKm).toBeGreaterThan(direct.distanceKm * 2);
  });

  it('throws RouteNotFoundError when avoiding a pass that is the only connection in a small fixture graph', () => {
    // Unlike the real seed network (one connected loop, so there's always
    // *some* alternative), a graph where the avoided pass is the only edge
    // has no alternative at all.
    const graph = new Graph(
      20,
      [new Node({ id: 'a', lon: 0, lat: 0 }), new Node({ id: 'b', lon: 1, lat: 0 })],
      [new Edge({ id: 'ab', from: 'a', to: 'b', distanceKm: 111, pass: 'suez' })],
    );

    expect(() =>
      calculateRoute(
        graph,
        { origin: { lon: 0, lat: 0 }, destination: { lon: 1, lat: 0 } },
        { avoid: ['suez'] },
      ),
    ).toThrow(RouteNotFoundError);
  });

  it('snaps a coordinate to its nearest node and folds the snap distance into the total', async () => {
    const graph = await loadMaritimeGraph();

    // A few km off the real Rotterdam waypoint.
    const result = calculateRoute(graph, {
      origin: { lon: 4.5, lat: 52.0 },
      destination: { lon: 4.47, lat: 51.9 }, // exactly rotterdam
    });

    expect(result.metadata.origin.nodeId).toBe('rotterdam');
    expect(result.metadata.destination.nodeId).toBe('rotterdam');
    expect(result.metadata.origin.distanceKm).toBeGreaterThan(0);
    expect(result.metadata.destination.distanceKm).toBe(0);
    expect(result.distanceKm).toBeCloseTo(result.metadata.origin.distanceKm, 1);
  });
});

describe('calculateRoute — validation and error handling', () => {
  function twoNodeGraph(): Graph {
    return new Graph(
      20,
      [new Node({ id: 'a', lon: 0, lat: 0 }), new Node({ id: 'b', lon: 1, lat: 0 })],
      [new Edge({ id: 'ab', from: 'a', to: 'b', distanceKm: 111, pass: 'suez' })],
    );
  }

  it('rejects an out-of-range latitude', () => {
    const graph = twoNodeGraph();
    expect(() =>
      calculateRoute(graph, { origin: { lon: 0, lat: 91 }, destination: { lon: 1, lat: 0 } }),
    ).toThrow(RouteValidationError);
  });

  it('rejects an out-of-range longitude', () => {
    const graph = twoNodeGraph();
    expect(() =>
      calculateRoute(graph, { origin: { lon: 200, lat: 0 }, destination: { lon: 1, lat: 0 } }),
    ).toThrow(RouteValidationError);
  });

  it('rejects a non-finite coordinate', () => {
    const graph = twoNodeGraph();
    expect(() =>
      calculateRoute(graph, { origin: { lon: NaN, lat: 0 }, destination: { lon: 1, lat: 0 } }),
    ).toThrow(RouteValidationError);
  });

  it('rejects an unknown pass name in avoid', () => {
    const graph = twoNodeGraph();
    expect(() =>
      calculateRoute(
        graph,
        { origin: { lon: 0, lat: 0 }, destination: { lon: 1, lat: 0 } },
        // @ts-expect-error deliberately invalid input, for the runtime check
        { avoid: ['not-a-real-pass'] },
      ),
    ).toThrow(/Unknown pass name/);
  });

  it('rejects options.resolutionKm disagreeing with the provided graph', () => {
    const graph = twoNodeGraph(); // resolutionKm: 20
    expect(() =>
      calculateRoute(
        graph,
        { origin: { lon: 0, lat: 0 }, destination: { lon: 1, lat: 0 } },
        { resolutionKm: 50 },
      ),
    ).toThrow(/does not match/);
  });

  it('throws when the origin and destination are in disconnected parts of the graph', () => {
    const graph = new Graph(
      20,
      [
        new Node({ id: 'a', lon: 0, lat: 0 }),
        new Node({ id: 'b', lon: 1, lat: 0 }),
        new Node({ id: 'c', lon: 50, lat: 50 }),
        new Node({ id: 'd', lon: 51, lat: 50 }),
      ],
      [
        new Edge({ id: 'ab', from: 'a', to: 'b', distanceKm: 111 }),
        new Edge({ id: 'cd', from: 'c', to: 'd', distanceKm: 111 }),
      ],
    );

    expect(() =>
      calculateRoute(graph, { origin: { lon: 0, lat: 0 }, destination: { lon: 51, lat: 50 } }),
    ).toThrow(RouteNotFoundError);
  });

  it('returns a zero-length route when origin and destination snap to the same node', () => {
    const graph = twoNodeGraph();

    const result = calculateRoute(graph, {
      origin: { lon: 0, lat: 0 },
      destination: { lon: 0, lat: 0 },
    });

    expect(result.distanceKm).toBe(0);
    expect(result.metadata.origin.nodeId).toBe(result.metadata.destination.nodeId);
    expect(result.metadata.passesUsed).toEqual([]);
  });
});

describe('computeRoute — resolution selection', () => {
  it('loads the default resolution when none is specified', async () => {
    const result = await computeRoute({
      origin: { lon: 5.3, lat: 43.3 },
      destination: { lon: 121.8, lat: 31.2 },
    });

    expect(result.metadata.resolutionKm).toBe(20);
  });

  it('loads a specific, available resolution', async () => {
    const result = await computeRoute(
      { origin: { lon: 5.3, lat: 43.3 }, destination: { lon: 121.8, lat: 31.2 } },
      { resolutionKm: 50 },
    );

    expect(result.metadata.resolutionKm).toBe(50);
  });

  it('rejects a syntactically valid but unavailable resolution with NetworkUnavailableError', async () => {
    const { NetworkUnavailableError } = await import('./errors');

    await expect(
      computeRoute(
        { origin: { lon: 5.3, lat: 43.3 }, destination: { lon: 121.8, lat: 31.2 } },
        { resolutionKm: 10 },
      ),
    ).rejects.toThrow(NetworkUnavailableError);
  });
});
