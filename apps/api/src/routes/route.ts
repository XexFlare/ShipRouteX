import {
  PASS_NAMES,
  RESOLUTIONS_KM,
  RouteCalculationError,
  RouteNotFoundError,
  computeRoute,
  isPassName,
  isResolutionKm,
  type PassName,
  type ResolutionKm,
  type RouteOptions,
} from '@shiproutesx/core';
import type { FastifyPluginAsync } from 'fastify';

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteOptionsBody {
  avoid?: unknown[];
  resolutionKm?: number;
}

interface RouteRequestBody {
  origin: LatLng;
  destination: LatLng;
  options?: RouteOptionsBody;
}

function isLatLng(value: unknown): value is LatLng {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['lat'] === 'number' && typeof v['lng'] === 'number';
}

function isRouteOptionsBody(value: unknown): value is RouteOptionsBody {
  if (value === undefined) return true;
  if (typeof value !== 'object' || value === null) return false;

  const v = value as Record<string, unknown>;
  if (v['avoid'] !== undefined && !Array.isArray(v['avoid'])) return false;
  if (v['resolutionKm'] !== undefined && typeof v['resolutionKm'] !== 'number') return false;
  return true;
}

function isRouteRequestBody(value: unknown): value is RouteRequestBody {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return isLatLng(v['origin']) && isLatLng(v['destination']) && isRouteOptionsBody(v['options']);
}

/**
 * Parses the wire-format `options` object into a typed `RouteOptions`,
 * returning either the parsed value or a client-facing error message —
 * never throws, so the route handler can turn a bad `avoid`/`resolutionKm`
 * into a clean 400 without relying on exceptions for control flow here.
 */
function parseRouteOptions(body: RouteOptionsBody | undefined): RouteOptions | { error: string } {
  const options: RouteOptions = {};

  if (body?.avoid !== undefined) {
    const invalid = body.avoid.filter((name) => !isPassName(name));
    if (invalid.length > 0) {
      return {
        error: `options.avoid contains unknown pass name(s): ${invalid.join(', ')}. Valid names: ${PASS_NAMES.join(', ')}`,
      };
    }
    options.avoid = body.avoid as PassName[];
  }

  if (body?.resolutionKm !== undefined) {
    if (!isResolutionKm(body.resolutionKm)) {
      return { error: `options.resolutionKm must be one of: ${RESOLUTIONS_KM.join(', ')}` };
    }
    options.resolutionKm = body.resolutionKm as ResolutionKm;
  }

  return options;
}

/**
 * `POST /route` — computes a maritime route between two coordinates.
 *
 * A thin transport layer over `@shiproutesx/core`'s `computeRoute`: this
 * plugin only translates the wire format (`{ lat, lng }`, the conventional
 * REST shape) to/from the routing engine's own `Coordinate` (`{ lon, lat }`)
 * type, validates `options` before it ever reaches the engine, and maps
 * `RouteCalculationError` subclasses to HTTP status codes. It contains no
 * routing logic itself.
 *
 * Request body: `{ origin: {lat,lng}, destination: {lat,lng}, options?: {
 * avoid?: string[], resolutionKm?: number } }`.
 *
 * Error mapping: `RouteNotFoundError` -> 404 (well-formed request, no route
 * exists); every other `RouteCalculationError` (bad coordinates, an unknown
 * `avoid` name, an unavailable resolution) -> 400; anything else is a bug
 * and is rethrown for Fastify's default 500 handler.
 */
export const routeRoute: FastifyPluginAsync = async (app) => {
  app.post('/route', async (request, reply) => {
    const body: unknown = request.body;

    if (!isRouteRequestBody(body)) {
      return reply.status(400).send({
        error:
          'Request body must be { origin: {lat,lng}, destination: {lat,lng}, options?: { avoid?: string[], resolutionKm?: number } }',
        code: 'ROUTE_VALIDATION_ERROR',
      });
    }

    const options = parseRouteOptions(body.options);
    if ('error' in options) {
      return reply.status(400).send({ error: options.error, code: 'ROUTE_VALIDATION_ERROR' });
    }

    try {
      return await computeRoute(
        {
          origin: { lon: body.origin.lng, lat: body.origin.lat },
          destination: { lon: body.destination.lng, lat: body.destination.lat },
        },
        options,
      );
    } catch (error) {
      if (error instanceof RouteNotFoundError) {
        return reply.status(404).send({ error: error.message, code: error.code });
      }
      if (error instanceof RouteCalculationError) {
        return reply.status(400).send({ error: error.message, code: error.code });
      }
      throw error;
    }
  });
};
