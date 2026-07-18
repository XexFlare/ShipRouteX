import { DEFAULT_RESOLUTION_KM, loadMaritimeGraph } from '@shiproutesx/core';
import { buildApp } from './app';

const port = Number(process.env.PORT ?? 3041);
const host = process.env.HOST ?? '0.0.0.0';

const app = buildApp();

async function start(): Promise<void> {
  const startedAt = performance.now();
  const graph = await loadMaritimeGraph(DEFAULT_RESOLUTION_KM);
  const loadMs = Math.round(performance.now() - startedAt);

  app.log.info(
    { resolution: graph.resolutionLabel, nodes: graph.nodeCount, edges: graph.edgeCount, loadMs },
    'Maritime graph loaded',
  );

  const address = await app.listen({ port, host });
  app.log.info(`ShipRoutesX API listening at ${address}`);
}

start().catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
