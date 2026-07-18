import {
  DEFAULT_RESOLUTION_KM,
  RESOLUTIONS_KM,
  getLoadedMaritimeGraph,
  isResolutionKm,
  type ResolutionKm,
} from '@shiproutesx/core';
import type { FastifyPluginAsync } from 'fastify';

interface GraphStatsResponse {
  loaded: boolean;
  nodes: number;
  edges: number;
  resolution: string;
}

/**
 * `GET /graph/stats?resolutionKm=<number>` — reports whether the maritime
 * graph for a resolution is currently loaded in memory, and its node/edge
 * counts if so. Defaults to `DEFAULT_RESOLUTION_KM` when `resolutionKm` is
 * omitted.
 *
 * Read-only: this never triggers a load as a side effect (unlike
 * `POST /route`, which lazily loads whichever resolution it needs) — it
 * only reports what's already in `GraphCache`, so repeatedly polling it
 * can't itself cause network files to be read from disk.
 */
export const graphStatsRoute: FastifyPluginAsync = async (app) => {
  app.get('/graph/stats', async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    let resolutionKm: ResolutionKm = DEFAULT_RESOLUTION_KM;

    if (query['resolutionKm'] !== undefined) {
      const parsed = Number(query['resolutionKm']);
      if (!isResolutionKm(parsed)) {
        return reply.status(400).send({
          error: `resolutionKm must be one of: ${RESOLUTIONS_KM.join(', ')}`,
        });
      }
      resolutionKm = parsed;
    }

    const graph = getLoadedMaritimeGraph(resolutionKm);

    const response: GraphStatsResponse = graph
      ? {
          loaded: true,
          nodes: graph.nodeCount,
          edges: graph.edgeCount,
          resolution: graph.resolutionLabel,
        }
      : { loaded: false, nodes: 0, edges: 0, resolution: `${resolutionKm}km` };

    return response;
  });
};
