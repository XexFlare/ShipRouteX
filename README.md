# ShipRoutesX

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-6BA539)
![Status](https://img.shields.io/badge/status-early%20engine-yellow)

**A modern TypeScript maritime routing engine** — computes shortest shipping routes between two coordinates over a real graph of shipping lanes, with support for avoiding named chokepoints (Suez, Panama, Malacca, ...), multiple network resolutions, and GeoJSON output. Part of the **AIFlare** ecosystem.

```bash
curl -X POST http://localhost:3041/route \
  -H "Content-Type: application/json" \
  -d '{"origin":{"lat":43.3,"lng":5.3},"destination":{"lat":31.2,"lng":121.8}}'
```

```json
{
  "distanceKm": 15728.3,
  "geometry": { "type": "LineString", "coordinates": [["...", "..."]] },
  "metadata": {
    "passesUsed": ["babelmandeb", "malacca", "suez"],
    "origin": { "nodeId": "marseille", "distanceKm": 0 },
    "destination": { "nodeId": "shanghai", "distanceKm": 0 }
  }
}
```

More real, worked examples (including avoiding a chokepoint, which reroutes ~11,000 km differently) live in [`docs/examples/`](docs/examples/).

## Contents

- [Status](#status)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Status

🚧 **Early routing engine — not yet production-ready.** The landing page (`apps/web`) runs standalone. The routing engine (`packages/graph` + `packages/core`) computes real routes over a **hand-authored starter network** (not yet the full SeaRoute-derived dataset — see [`docs/searoute-architecture-analysis.md`](docs/searoute-architecture-analysis.md) §17.1), exposed via `POST /route` and `GET /graph/stats`. `packages/platform` (auth, API keys, rate limiting, usage tracking) exists as interfaces + mocks only — **no request is authenticated today**. See [Documentation](#documentation) below for the full picture, including exactly what isn't built yet.

## Quick Start

**Prerequisites:** Node.js 22+ and npm (see [`docs/installation.md`](docs/installation.md) for details and troubleshooting).

```bash
git clone https://github.com/<your-fork-or-org>/shiproutesx.git
cd shiproutesx
npm install
npm run dev
```

This starts the **landing page** at `http://localhost:3040` and the **API** at `http://localhost:3041` together, in watch mode. Try:

```bash
curl http://localhost:3041/health
# {"status":"ok"}

curl http://localhost:3041/graph/stats
# {"loaded":true,"nodes":22,"edges":23,"resolution":"20km"}
```

See [`docs/api.md`](docs/api.md) for every endpoint, and [`docs/examples/`](docs/examples/) for ready-to-run request/response pairs.

## Documentation

| Doc                                                                                | What's in it                                                                                                     |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)                                     | How ShipRoutesX itself is built: package boundaries, request lifecycle, data model, key design decisions and why |
| [`docs/installation.md`](docs/installation.md)                                     | Prerequisites, setup, verifying your environment, troubleshooting                                                |
| [`docs/development.md`](docs/development.md)                                       | Day-to-day commands, where different kinds of changes belong, testing conventions                                |
| [`docs/api.md`](docs/api.md)                                                       | Full endpoint reference: every request/response shape and error code                                             |
| [`openapi.json`](openapi.json) (also served at `GET /openapi.json`)                | Machine-readable OpenAPI 3.1 spec                                                                                |
| [`docs/examples/`](docs/examples/)                                                 | Real request/response pairs, plus a `.http` file you can run directly in an editor                               |
| [`docs/platform-architecture.md`](docs/platform-architecture.md)                   | The planned (not yet enabled) authentication/API-keys/rate-limiting flow                                         |
| [`docs/searoute-architecture-analysis.md`](docs/searoute-architecture-analysis.md) | Deep-dive on Eurostat's SeaRoute — the Java project this is architecturally inspired by (not a port of)          |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                                               | How to propose and submit a change                                                                               |

## Tech Stack

| Concern            | Choice                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Language           | TypeScript (strict mode)                                                                                                                        |
| Runtime            | Node.js 22+                                                                                                                                     |
| HTTP framework     | [Fastify](https://fastify.dev) 5                                                                                                                |
| Web frontend       | [Vite](https://vite.dev) + vanilla TypeScript (no UI framework)                                                                                 |
| Package management | npm workspaces (no pnpm, no Docker)                                                                                                             |
| Testing            | [Vitest](https://vitest.dev)                                                                                                                    |
| Linting            | [ESLint](https://eslint.org) 9 (flat config) + `typescript-eslint`                                                                              |
| Formatting         | [Prettier](https://prettier.io)                                                                                                                 |
| API docs           | Hand-maintained [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) spec, served at `GET /openapi.json`                                         |
| Deployment target  | [Netlify](https://www.netlify.com) — `apps/web` is configured (see [`netlify.toml`](netlify.toml)); `apps/api` needs a serverless adapter first |

## Project Structure

```
shiproutesx/
├── apps/
│   ├── api/                  Fastify HTTP layer (GET /, /health, /graph/stats, /openapi.json; POST /route)
│   │   └── src/middleware/     Prepared-but-not-registered auth middleware (see docs/platform-architecture.md)
│   └── web/                  Landing page — Vite + vanilla TypeScript, static build
├── packages/
│   ├── core/                 Routing domain logic — network loading, calculateRoute()/computeRoute() — framework-independent
│   ├── graph/                 Generic Node/Edge/Graph + GraphLoader/GraphCache + heap-based Dijkstra — no maritime knowledge
│   ├── platform/               Auth/API-keys/rate-limiting/usage-tracking/developer-accounts — interfaces + mocks only
│   └── shared/                Cross-cutting types + geo utilities (Coordinate, haversineKm)
├── data/
│   ├── networks/{20,50,100}km.json  Starter maritime network (real waypoints, computed great-circle distances)
│   └── scripts/                       Regenerates the starter network — see data/README.md
├── docs/                      Architecture, installation, development, API docs, examples (see above)
├── openapi.json               OpenAPI 3.1 spec for apps/api
├── netlify.toml               Netlify build config for apps/web
└── .github/workflows/         CI pipeline (lint, build, typecheck, test)
```

Dependency direction is one-way and enforced by the package graph, not just convention: `api → core → graph → shared`, and separately `api → platform` (never `core`/`graph` → `platform`). See [`docs/architecture.md`](docs/architecture.md) for the full diagram and rationale.

## Roadmap

**Done:**

- [x] Graph engine (`Node`/`Edge`/`Graph`/`GraphLoader`/`GraphCache`) with binary-heap Dijkstra, loaded once and cached per resolution
- [x] Starter maritime network at three resolutions (20/50/100 km)
- [x] `calculateRoute()`/`computeRoute()`: nearest-node snapping, chokepoint avoidance (`RouteOptions.avoid`), distance calculation, GeoJSON generation, rich metadata
- [x] A typed error hierarchy (`ROUTE_VALIDATION_ERROR`/`ROUTE_NOT_FOUND`/`NETWORK_UNAVAILABLE`) mapped to HTTP status codes
- [x] `GET /graph/stats`, `POST /route`, `GET /openapi.json`
- [x] `packages/platform`: interfaces + mocks for auth, API keys, rate limiting, usage tracking, developer accounts (not enabled)
- [x] Netlify deployment config for `apps/web`

**Next:**

- [ ] The real, SeaRoute-derived maritime network (today's three resolution files are hand-authored and currently identical to each other)
- [ ] A spatial index for nearest-node lookups (currently a documented, intentional linear scan)
- [ ] Antimeridian (±180°) handling in `calculateRoute()`
- [ ] Real authentication (replacing `MockAuthenticator`) and enabling the prepared middleware
- [ ] Rate-limiting and usage-tracking middleware hooks
- [ ] A persistent datastore behind the platform services
- [ ] A serverless adapter so `apps/api` can also deploy to Netlify

## Contributing

Issues and PRs are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, conventions, and what to run before opening a PR (`npm run build && npm run lint && npm run format:check && npm test`).

## Acknowledgments

ShipRoutesX's architecture is **inspired by** Eurostat's [SeaRoute](https://github.com/eurostat/searoute) (EUPL-1.2) — a Java project that computes shortest maritime routes over a pre-built graph using Dijkstra's algorithm. ShipRoutesX is **not** a port or translation of that codebase; see [`docs/searoute-architecture-analysis.md`](docs/searoute-architecture-analysis.md) for the analysis this project's design decisions are based on. ShipRoutesX is also intended to power sibling AIFlare tools that need maritime distance/route data.

## License

[MIT](LICENSE) © 2026 AIFlare
