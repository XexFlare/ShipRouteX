import { loadMaritimeGraph } from '@shiproutesx/core';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app';

describe('GET /openapi.json', () => {
  it('serves the OpenAPI spec as JSON', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/openapi.json' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const spec = response.json();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths).toHaveProperty('/route');
    expect(spec.paths).toHaveProperty('/graph/stats');

    await app.close();
  });
});

describe('GET /', () => {
  it('returns service metadata', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      name: 'ShipRoutesX',
      version: '0.1.0',
      status: 'running',
    });

    await app.close();
  });
});

describe('GET /health', () => {
  it('returns ok status', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });
});

// Runs before any test calls loadMaritimeGraph(), so it exercises the
// genuine "graph not loaded yet" state of the process-wide cache — later
// blocks below load the graph and keep it loaded for the rest of this file
// (Node caches ES module instances, so the maritime-network singleton
// persists across tests within one file).
describe('before the maritime graph has loaded', () => {
  it('GET /graph/stats reports loaded: false', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/graph/stats' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      loaded: false,
      nodes: 0,
      edges: 0,
      resolution: '20km',
    });

    await app.close();
  });

  it('POST /route lazily loads the graph on first request rather than failing', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        origin: { lat: 43.3, lng: 5.3 },
        destination: { lat: 31.2, lng: 121.8 },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().distanceKm).toBeCloseTo(15728.3, 1);

    await app.close();
  });
});

describe('GET /graph/stats — after the maritime graph has loaded', () => {
  it('reports real graph statistics for the default resolution', async () => {
    await loadMaritimeGraph();

    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/graph/stats' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.loaded).toBe(true);
    expect(body.resolution).toBe('20km');
    expect(body.nodes).toBeGreaterThan(0);
    expect(body.edges).toBeGreaterThan(0);

    await app.close();
  });

  it('reports loaded: false for a resolution that has not been requested yet', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/graph/stats?resolutionKm=50' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ loaded: false, nodes: 0, edges: 0, resolution: '50km' });

    await app.close();
  });

  it('rejects an unsupported resolutionKm query value with 400', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/graph/stats?resolutionKm=7' });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBeDefined();

    await app.close();
  });
});

describe('POST /route', () => {
  it('returns distanceKm, geometry, and metadata (with snapping info) for a known route', async () => {
    await loadMaritimeGraph();

    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        origin: { lat: 43.3, lng: 5.3 }, // marseille
        destination: { lat: 31.2, lng: 121.8 }, // shanghai
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.distanceKm).toBeCloseTo(15728.3, 1);
    expect(body.geometry.type).toBe('LineString');
    expect(body.geometry.coordinates[0]).toEqual([5.3, 43.3]);
    expect(body.geometry.coordinates.at(-1)).toEqual([121.8, 31.2]);
    expect(body.metadata.origin.nodeId).toBe('marseille');
    expect(body.metadata.destination.nodeId).toBe('shanghai');
    expect(body.metadata.origin.distanceKm).toBe(0);
    expect(new Set(body.metadata.passesUsed)).toEqual(new Set(['suez', 'babelmandeb', 'malacca']));
    expect(body.metadata.avoid).toEqual([]);
    expect(typeof body.metadata.computeTimeMs).toBe('number');

    await app.close();
  });

  it('honors options.avoid, routing around a blocked pass', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        origin: { lat: 43.3, lng: 5.3 },
        destination: { lat: 31.2, lng: 121.8 },
        options: { avoid: ['suez'] },
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.metadata.avoid).toEqual(['suez']);
    expect(body.metadata.passesUsed).not.toContain('suez');
    expect(body.distanceKm).toBeCloseTo(26799.5, 1);

    await app.close();
  });

  it('honors options.resolutionKm, routing over a non-default resolution', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        origin: { lat: 43.3, lng: 5.3 },
        destination: { lat: 31.2, lng: 121.8 },
        options: { resolutionKm: 50 },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().metadata.resolutionKm).toBe(50);

    await app.close();
  });

  it('rejects an unknown pass name in options.avoid with 400', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        origin: { lat: 43.3, lng: 5.3 },
        destination: { lat: 31.2, lng: 121.8 },
        options: { avoid: ['not-a-real-pass'] },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('ROUTE_VALIDATION_ERROR');
  });

  it('returns 400 with NETWORK_UNAVAILABLE for a resolution with no seed data', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        origin: { lat: 43.3, lng: 5.3 },
        destination: { lat: 31.2, lng: 121.8 },
        options: { resolutionKm: 10 },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('NETWORK_UNAVAILABLE');

    await app.close();
  });

  it('rejects a malformed request body with 400', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: { origin: { lat: 43.3 } },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBeDefined();

    await app.close();
  });

  it('rejects an out-of-range coordinate with 400', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        origin: { lat: 999, lng: 5.3 },
        destination: { lat: 31.2, lng: 121.8 },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/lat/);

    await app.close();
  });
});
