import { describe, expect, it } from 'vitest';
import {
  Edge,
  formatResolution,
  Graph,
  GraphCache,
  GraphLoader,
  Node,
  RESOLUTIONS_KM,
} from './index';

describe('@shiproutesx/graph public API', () => {
  it('loads, caches, and reads back a graph end-to-end through the public exports', async () => {
    const cache = new GraphCache();

    const graph = await cache.getOrLoad(20, () =>
      Promise.resolve(
        GraphLoader.fromData({
          resolutionKm: 20,
          nodes: [
            { id: 'marseille', lon: 5.3, lat: 43.3 },
            { id: 'shanghai', lon: 121.8, lat: 31.2 },
          ],
          edges: [{ id: 'e1', from: 'marseille', to: 'shanghai', distanceKm: 20651, pass: 'suez' }],
        }),
      ),
    );

    expect(graph).toBeInstanceOf(Graph);
    expect(graph.getNode('marseille')).toBeInstanceOf(Node);
    expect(graph.getEdge('e1')).toBeInstanceOf(Edge);
    expect(graph.resolutionLabel).toBe(formatResolution(20));
    expect(cache.isLoaded(20)).toBe(true);
  });

  it('exposes the documented resolution tiers', () => {
    expect(RESOLUTIONS_KM).toEqual([5, 10, 20, 50, 100]);
  });
});
