# API Reference

Base URL (local development): `http://localhost:3041`

A machine-readable [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) spec is available at [`GET /openapi.json`](#get-openapijson) once the server is running, and checked into the repo at [`openapi.json`](../openapi.json). Concrete example requests/responses live in [`docs/examples/`](examples/).

## Overview

| Method | Path                              | Purpose                          |
| ------ | --------------------------------- | -------------------------------- |
| `GET`  | [`/`](#get-)                      | Service metadata                 |
| `GET`  | [`/health`](#get-health)          | Liveness check                   |
| `GET`  | [`/graph/stats`](#get-graphstats) | Maritime graph load status/stats |
| `POST` | [`/route`](#post-route)           | Compute a maritime route         |
| `GET`  | `/openapi.json`                   | This API's OpenAPI 3.1 spec      |

Every error response — from any endpoint — has the shape `{ "error": string, "code"?: string }`. `code` is present for errors raised by the routing engine (see [Error codes](#error-codes)) and absent for generic request-validation failures that don't originate there.

There is currently **no authentication** on any endpoint — see [`platform-architecture.md`](platform-architecture.md) for why, and what's planned.

---

## `GET /`

Service identification.

**Response `200`**

```json
{ "name": "ShipRoutesX", "version": "0.1.0", "status": "running" }
```

---

## `GET /health`

Liveness check — returns `200` as long as the process is up and Fastify is accepting requests. Does not check that the maritime graph has loaded (see `GET /graph/stats` for that).

**Response `200`**

```json
{ "status": "ok" }
```

---

## `GET /graph/stats`

Reports whether the maritime graph for a resolution is currently loaded in memory, and its size if so. **Read-only** — unlike `POST /route`, this never triggers a load; it only reports what's already cached.

### Query parameters

| Name           | Type   | Default | Description                                                                                           |
| -------------- | ------ | ------- | ----------------------------------------------------------------------------------------------------- |
| `resolutionKm` | number | `20`    | Which resolution to report on. Must be one of `5, 10, 20, 50, 100` — see [Resolutions](#resolutions). |

### Response `200`

```json
{ "loaded": true, "nodes": 22, "edges": 23, "resolution": "20km" }
```

If that resolution hasn't been loaded yet (e.g. no request has used it, and it isn't the default):

```json
{ "loaded": false, "nodes": 0, "edges": 0, "resolution": "50km" }
```

### Response `400`

```json
{ "error": "resolutionKm must be one of: 5, 10, 20, 50, 100" }
```

Returned for a `resolutionKm` outside the five recognized tiers. Note this is different from a _recognized but unavailable_ resolution (see [Resolutions](#resolutions)) — that's a valid query here and just reports `loaded: false`.

---

## `POST /route`

Computes a maritime route between two coordinates.

### Request body

```ts
{
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  options?: {
    avoid?: string[];       // any of: suez, panama, malacca, gibraltar, dover,
                            // bering, magellan, babelmandeb, kiel, corinth,
                            // northwest, northeast
    resolutionKm?: number;  // one of: 5, 10, 20, 50, 100 (see Resolutions)
  };
}
```

`origin`/`destination` are required. `options` and every field inside it are optional. `lat` must be between -90 and 90; `lng` between -180 and 180.

### Response `200`

```ts
{
  distanceKm: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat] pairs — GeoJSON order, not [lat, lon]
  };
  metadata: {
    resolutionKm: number;
    avoid: string[];        // deduplicated, sorted — what was actually applied
    passesUsed: string[];   // named chokepoints the computed route actually transits
    origin: { nodeId: string; coordinate: { lon: number; lat: number }; distanceKm: number };
    destination: { nodeId: string; coordinate: { lon: number; lat: number }; distanceKm: number };
    computeTimeMs: number;
  };
}
```

`metadata.origin`/`.destination` are the route's **snapping information**: your requested coordinate is snapped to the nearest node on the maritime network graph, and this reports exactly which node and how far off it was (`distanceKm: 0` means your input coordinate matched a network node exactly). `distanceKm` (top level) already includes both snap distances plus the path itself.

See [`docs/examples/`](examples/) for full worked examples, including an `avoid` request and its very different resulting route.

### Error responses

All non-2xx responses from this endpoint are `{ "error": string, "code": string }`. See [Error codes](#error-codes) for the full table.

```json
{
  "error": "origin.lat must be a finite number between -90 and 90",
  "code": "ROUTE_VALIDATION_ERROR"
}
```

---

## Resolutions

ShipRoutesX's network data model supports five resolution tiers (`5`, `10`, `20`, `50`, `100` km — matching the tiers used by the SeaRoute project this is architecturally inspired by). **Only `20`, `50`, and `100` currently have data** (`data/networks/{20,50,100}km.json`); `5` and `10` are recognized, valid values that will return a `NETWORK_UNAVAILABLE` error, not a validation error, because the _value_ is fine — the _data_ just isn't there yet. See [`data/README.md`](../data/README.md).

Also worth knowing while this is still a starter dataset: `20km.json`, `50km.json`, and `100km.json` currently contain **identical data** under different labels — there's no real per-resolution simplification yet (see [`architecture.md`](architecture.md)).

## Error codes

| `code`                   | HTTP status | Meaning                                                                                                                                                                                                                                       |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ROUTE_VALIDATION_ERROR` | 400         | The request itself was invalid: a malformed coordinate, an unknown name in `avoid`, or (only possible when calling `calculateRoute` directly as a library, not through this API) a `resolutionKm` that disagrees with the graph it was given. |
| `ROUTE_NOT_FOUND`        | 404         | The request was well-formed, but no path connects the snapped origin and destination — including "connects only via a pass you asked to avoid."                                                                                               |
| `NETWORK_UNAVAILABLE`    | 400         | `resolutionKm` is a recognized value, but no network data file exists for it yet (see [Resolutions](#resolutions)).                                                                                                                           |

A malformed request body that doesn't even match the basic shape (e.g. missing `origin`) returns `400` with no `code` field — that check happens before the routing engine (and its typed errors) is ever reached.

## Rate limits, authentication

None yet. Every endpoint is open and unauthenticated. See [`platform-architecture.md`](platform-architecture.md) for the planned flow — nothing described there is enforced today.
