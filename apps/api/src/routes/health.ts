import type { FastifyPluginAsync } from 'fastify';

interface HealthResponse {
  status: 'ok';
}

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/health', async (): Promise<HealthResponse> => ({ status: 'ok' }));
};
