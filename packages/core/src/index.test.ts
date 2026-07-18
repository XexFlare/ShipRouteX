import { describe, expect, it } from 'vitest';
import { DEFAULT_RESOLUTION_KM, loadMaritimeGraph, type Coordinate } from './index';

describe('@shiproutesx/core public API', () => {
  it('exposes the default resolution', () => {
    expect(DEFAULT_RESOLUTION_KM).toBe(20);
  });

  it('re-exports shared geo types', () => {
    const origin: Coordinate = { lon: 5.3, lat: 43.3 };
    expect(origin).toBeDefined();
  });

  it('loads the maritime graph through the public API', async () => {
    const graph = await loadMaritimeGraph();
    expect(graph.nodeCount).toBeGreaterThan(0);
  });
});
