import type { FastifyPluginAsync } from 'fastify';

interface RootResponse {
  name: string;
  version: string;
  status: 'running';
}

export const rootRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async (): Promise<RootResponse> => ({
    name: 'ShipRoutesX',
    version: '0.1.0',
    status: 'running',
  }));
};
