import { describe, expect, it, vi } from 'vitest';
import { Graph } from './graph';
import { GraphCache } from './graph-cache';

function emptyGraph(resolutionKm: 5 | 10 | 20 | 50 | 100 = 20): Graph {
  return new Graph(resolutionKm, [], []);
}

describe('GraphCache', () => {
  it('reports not loaded before any load has happened', () => {
    const cache = new GraphCache();

    expect(cache.isLoaded(20)).toBe(false);
    expect(cache.getIfLoaded(20)).toBeUndefined();
  });

  it('loads once and returns the same Graph instance on later calls', async () => {
    const cache = new GraphCache();
    const graph = emptyGraph();
    const load = vi.fn().mockResolvedValue(graph);

    const first = await cache.getOrLoad(20, load);
    const second = await cache.getOrLoad(20, load);

    expect(first).toBe(graph);
    expect(second).toBe(graph);
    expect(load).toHaveBeenCalledTimes(1);
    expect(cache.isLoaded(20)).toBe(true);
    expect(cache.getIfLoaded(20)).toBe(graph);
  });

  it('shares a single in-flight load across concurrent callers', async () => {
    const cache = new GraphCache();
    const graph = emptyGraph();
    let resolveLoad!: (g: Graph) => void;
    const load = vi.fn().mockReturnValue(new Promise<Graph>((resolve) => (resolveLoad = resolve)));

    const callA = cache.getOrLoad(20, load);
    const callB = cache.getOrLoad(20, load);

    resolveLoad(graph);
    const [a, b] = await Promise.all([callA, callB]);

    expect(a).toBe(graph);
    expect(b).toBe(graph);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps resolutions independent of one another', async () => {
    const cache = new GraphCache();
    const graph20 = emptyGraph(20);
    const graph50 = emptyGraph(50);

    await cache.getOrLoad(20, () => Promise.resolve(graph20));
    await cache.getOrLoad(50, () => Promise.resolve(graph50));

    expect(cache.getIfLoaded(20)).toBe(graph20);
    expect(cache.getIfLoaded(50)).toBe(graph50);
  });

  it('does not cache a failed load, allowing a later call to retry', async () => {
    const cache = new GraphCache();
    const failing = vi.fn().mockRejectedValue(new Error('disk error'));

    await expect(cache.getOrLoad(20, failing)).rejects.toThrow('disk error');
    expect(cache.isLoaded(20)).toBe(false);

    const graph = emptyGraph();
    const succeeding = vi.fn().mockResolvedValue(graph);
    const result = await cache.getOrLoad(20, succeeding);

    expect(result).toBe(graph);
    expect(cache.isLoaded(20)).toBe(true);
  });

  it('clear() resets all cached and pending state', async () => {
    const cache = new GraphCache();
    await cache.getOrLoad(20, () => Promise.resolve(emptyGraph()));

    cache.clear();

    expect(cache.isLoaded(20)).toBe(false);
  });
});
