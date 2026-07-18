import { describe, expect, it } from 'vitest';
import { getLoadedMaritimeGraph, loadMaritimeGraph } from './maritime-network';

describe('loadMaritimeGraph', () => {
  it('loads the real seed network file for the default (20km) resolution', async () => {
    const graph = await loadMaritimeGraph();

    expect(graph.resolutionKm).toBe(20);
    expect(graph.resolutionLabel).toBe('20km');
    expect(graph.nodeCount).toBeGreaterThan(0);
    expect(graph.edgeCount).toBeGreaterThan(0);
  });

  it('returns the exact same Graph instance on a second call (loads once, cached)', async () => {
    const first = await loadMaritimeGraph();
    const second = await loadMaritimeGraph();

    expect(second).toBe(first);
  });

  it('is reflected by getLoadedMaritimeGraph once loaded', async () => {
    await loadMaritimeGraph();

    expect(getLoadedMaritimeGraph()).toBeDefined();
    expect(getLoadedMaritimeGraph()?.resolutionKm).toBe(20);
  });

  it('loads a non-default resolution that has seed data (50km)', async () => {
    const graph = await loadMaritimeGraph(50);

    expect(graph.resolutionKm).toBe(50);
    expect(graph.resolutionLabel).toBe('50km');
  });

  it('rejects a resolution with no seed data file (10km is deliberately not generated)', async () => {
    await expect(loadMaritimeGraph(10)).rejects.toThrow();
  });
});
