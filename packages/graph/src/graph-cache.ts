import type { Graph } from './graph';
import type { ResolutionKm } from './types';

/**
 * Ensures each resolution's `Graph` is loaded at most once and reused for
 * the lifetime of the process.
 *
 * - A resolution that's already loaded is never reloaded — `getOrLoad`
 *   always returns the same `Graph` instance for a given resolution.
 * - Concurrent calls for a resolution that hasn't finished loading share
 *   the same in-flight load instead of triggering duplicate loads.
 * - A failed load does not poison the cache — a later call is free to retry.
 */
export class GraphCache {
  private readonly resolved = new Map<ResolutionKm, Graph>();
  private readonly pending = new Map<ResolutionKm, Promise<Graph>>();

  /** True once a resolution has finished loading. */
  isLoaded(resolutionKm: ResolutionKm): boolean {
    return this.resolved.has(resolutionKm);
  }

  /** The graph for a resolution if it has already finished loading, else undefined. */
  getIfLoaded(resolutionKm: ResolutionKm): Graph | undefined {
    return this.resolved.get(resolutionKm);
  }

  /**
   * Returns the cached graph for a resolution, loading it via `load` on
   * first request. Never reloads an already-loaded (or already in-flight)
   * resolution.
   */
  async getOrLoad(resolutionKm: ResolutionKm, load: () => Promise<Graph>): Promise<Graph> {
    const alreadyResolved = this.resolved.get(resolutionKm);
    if (alreadyResolved) return alreadyResolved;

    const inFlight = this.pending.get(resolutionKm);
    if (inFlight) return inFlight;

    const loadPromise = load().then(
      (graph) => {
        this.resolved.set(resolutionKm, graph);
        this.pending.delete(resolutionKm);
        return graph;
      },
      (error: unknown) => {
        this.pending.delete(resolutionKm);
        throw error;
      },
    );

    this.pending.set(resolutionKm, loadPromise);
    return loadPromise;
  }

  /** Test-only: clears all cached and in-flight graphs. */
  clear(): void {
    this.resolved.clear();
    this.pending.clear();
  }
}
