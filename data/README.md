# Data

This directory holds the maritime network dataset(s) that power the ShipRoutesX routing engine — the TypeScript equivalent of SeaRoute's `marnet_plus_*.gpkg` resolution tiers (see [`docs/searoute-architecture-analysis.md`](../docs/searoute-architecture-analysis.md), §6 and §17.1).

## `networks/{20,50,100}km.json`

A **starter** network — not yet the real SeaRoute-derived dataset. ~20 real waypoints along well-known shipping lanes (Rotterdam, Gibraltar, Suez, Bab-el-Mandeb, Malacca, Panama, ...), connected by great-circle distances, with a handful of edges tagged with the named chokepoint they transit (`"pass": "suez"`, `"panama"`, `"malacca"`, `"babelmandeb"`, `"gibraltar"`). It exists so `packages/graph`'s `GraphLoader`/`GraphCache` and `packages/core`'s `calculateRoute()`/`computeRoute()` have real, non-trivial, geographically real data to load and route over — including exercising the multi-resolution and chokepoint-avoidance (`RouteOptions.avoid`) features end-to-end.

**Every resolution file is currently identical data**, just under a different `resolutionKm` label — this starter dataset has no per-resolution generalization pipeline behind it (unlike the real SeaRoute network, which is genuinely simplified more aggressively at coarser tiers). `5km.json` and `10km.json` are deliberately **not** generated, so requesting them exercises the real "resolution unavailable" error path (`NetworkUnavailableError`) rather than a mock.

Shape:

```json
{
  "resolutionKm": 20,
  "nodes": [{ "id": "marseille", "lon": 5.3, "lat": 43.3 }],
  "edges": [
    { "id": "e4", "from": "marseille", "to": "piraeus", "distanceKm": 1653.3, "pass": null }
  ]
}
```

## `scripts/generate-seed-network.mjs`

Regenerates all three `networks/{20,50,100}km.json` files from one hand-maintained waypoint/edge list, computing each edge's `distanceKm` via the haversine formula rather than hand-typed numbers. Run it after editing the waypoint list:

```bash
node data/scripts/generate-seed-network.mjs
```

## Adding a real per-resolution network

`packages/graph` supports the same five tiers SeaRoute uses (5/10/20/50/100 km — see `RESOLUTIONS_KM` in `packages/graph/src/types.ts`), and `packages/core`'s `GraphCache` caches each resolution independently, keyed by `resolutionKm`. Dropping in `data/networks/{5,10}km.json` in the same shape (ideally with genuinely simplified/coarser data at wider resolutions, not a copy) is enough to make those resolutions loadable — no code changes required in `packages/graph`, `packages/core`, or `apps/api`.
