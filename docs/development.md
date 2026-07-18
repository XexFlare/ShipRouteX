# Development Guide

See [`installation.md`](installation.md) first if you haven't already run `npm install && npm run dev` successfully.

## Project layout

See [`architecture.md`](architecture.md) for the full picture. The short version:

```
apps/api        Fastify HTTP layer — routes only translate HTTP <-> the engine's types
apps/web        Static landing page (Vite + vanilla TS) — no dependency on any package
packages/shared Coordinate type, haversineKm
packages/graph  Node/Edge/Graph, GraphLoader, GraphCache, findShortestPath (Dijkstra)
packages/core   loadMaritimeGraph, calculateRoute, computeRoute, RouteOptions, errors
packages/platform  Auth/API-keys/rate-limiting/usage-tracking mocks (not wired into requests)
data/networks   Maritime network JSON files
data/scripts    Regenerates the starter network data
```

## Everyday commands

Run all of these from the **repo root** — never inside an individual workspace folder.

| Command                           | What it does                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`                     | Starts the API (`:3041`) and landing page (`:3040`) together, in watch mode           |
| `npm run build`                   | `tsc -b` across `api`/`core`/`graph`/`platform`/`shared`, then `vite build` for `web` |
| `npm test`                        | Runs the Vitest suite in every workspace that has one                                 |
| `npm run lint` / `lint:fix`       | ESLint across the whole repo                                                          |
| `npm run format` / `format:check` | Prettier across the whole repo                                                        |
| `npm run clean`                   | Removes TypeScript's incremental build cache (`*.tsbuildinfo`)                        |

Scoped to one workspace, when you want faster feedback:

```bash
npm test --workspace=@shiproutesx/core
npm run build --workspace=@shiproutesx/graph
```

## Working on the routing engine (`packages/graph` / `packages/core`)

These packages have no framework dependency and no filesystem access beyond `packages/core`'s network loading — most changes here should be testable with plain Vitest, no HTTP involved.

- **Adding a graph algorithm** → `packages/graph`. It must stay maritime-agnostic: no concept of "ship," "port," or "chokepoint" belongs here, only generic graph/weight/path concepts. See `findShortestPath`'s `EdgeWeightFn` parameter for the pattern — the algorithm takes a weight function; it never encodes what the weight _means_.
- **Adding a routing feature (e.g. a new `RouteOptions` field)** → `packages/core`. Extend `RouteOptions` in `route-options.ts`, apply it inside `calculateRoute` in `route.ts`, and add both a unit test with a small fixture graph (fast, no I/O) and a known-route test against the real seed network (`loadMaritimeGraph()` — see existing tests in `route.test.ts` for the pattern).
- **Adding an error case** → add a new subclass of `RouteCalculationError` in `errors.ts` with its own `code`, throw it, and add the corresponding HTTP status mapping in `apps/api/src/routes/route.ts`.

## Working on the API (`apps/api`)

Route handlers should stay thin: parse/validate the wire format, call into `@shiproutesx/core`, map errors to status codes. If a route handler is doing anything that looks like routing _logic_ rather than _translation_, that logic almost certainly belongs in `packages/core` instead.

`buildApp()` (in `app.ts`) builds a Fastify instance without starting it — this is what tests use via `.inject()`, so a full test suite run never binds a real port.

## Working on the maritime network data (`data/`)

The current network is a small, hand-authored starter dataset (~20 real waypoints), **not** the real SeaRoute-derived network — see [`data/README.md`](../data/README.md) and [`searoute-architecture-analysis.md`](searoute-architecture-analysis.md) §17.1.

To change it: edit the `NODES`/`EDGES` tables in `data/scripts/generate-seed-network.mjs`, then regenerate:

```bash
node data/scripts/generate-seed-network.mjs
```

This recomputes every edge's `distanceKm` from real coordinates via the haversine formula — never hand-edit a `distanceKm` value directly in the generated JSON files, it'll just be overwritten (and likely wrong) the next time the script runs.

## Testing conventions

- Every package/app that has runtime code has a Vitest suite colocated with it (`*.test.ts` next to the file it tests).
- Prefer testing `packages/graph`/`packages/core` directly (fast, synchronous, no HTTP) over testing everything through `apps/api`'s HTTP layer. Reserve API-level tests for things that are genuinely about the HTTP layer: status codes, wire-format translation, error-to-status mapping.
- `apps/api/src/app.test.ts` is order-sensitive in one place: its "before the maritime graph has loaded" tests must run before anything calls `loadMaritimeGraph()`, because that graph cache is a module-level singleton shared by every test in the file. If you add tests to that file, keep the not-yet-loaded assertions first.
- `MinHeap` and `findShortestPath` both have dedicated correctness tests — if you touch either, run `npm test --workspace=@shiproutesx/graph` and confirm nothing regresses before touching `packages/core`.

## Before opening a pull request

```bash
npm run build
npm run lint
npm run format:check
npm test
```

All four must pass — this is exactly what CI (`.github/workflows/ci.yml`) runs. See [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for the full process.
