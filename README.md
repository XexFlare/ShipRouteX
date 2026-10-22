# ShipRoutesX

![License: MIT and EUPL-1.2](https://img.shields.io/badge/License-MIT%20%2B%20EUPL--1.2-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-6BA539)
![Status](https://img.shields.io/badge/status-early%20engine-yellow)

**A modern TypeScript maritime routing engine**, computes shortest shipping routes between two coordinates over a real graph of shipping lanes, with support for avoiding named chokepoints (Suez, Panama, Malacca, ...), multiple network resolutions, and GeoJSON output. Part of the **AIFlare** ecosystem.

The deployed routing API answers requests such as:

```text
GET /api/v1/route?from=KE-mombasa&to=WPI-31140&speed_knots=14&client=readme
```

with the distance in km and nautical miles, the passes used, the share of the route inside emission control areas and piracy-risk areas, and the GeoJSON line. The reference is [`docs/api-v1.md`](docs/api-v1.md).

This repo holds the routing engine and the data. The website, the API and their deployment are in a separate private repository.

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

The routing engine (`packages/graph` + `packages/core`) computes routes over the real SeaRoute-derived network (five resolutions from 5 km to 100 km, converted from Eurostat's data), with chokepoint avoidance, emission control and piracy-risk zone analysis, and GeoJSON output. The hand-authored starter network in `data/seed` is only a unit-test fixture. See [Documentation](#documentation) for the full picture, including what is not built yet.

## Quick Start

**Prerequisites:** Node.js 22+ and npm.

```bash
git clone https://github.com/XexFlare/ShipRouteX.git
cd ShipRouteX
npm install
npm test
```

The engine is a TypeScript library (`@shiproutesx/core`, `@shiproutesx/graph`, `@shiproutesx/shared`). Nothing here starts a server; the HTTP API that serves it lives in a separate private repository, which includes this repo as a Git submodule.

## Documentation

| Doc                                                                                | What's in it                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)                                     | How the engine is built: package boundaries, the network data model, key design decisions               |
| [`docs/api-v1.md`](docs/api-v1.md)                                                 | Reference for the deployed routing API (`/api/v1`)                                                      |
| [`openapi.json`](openapi.json)                                                     | Machine-readable OpenAPI 3.1 spec                                                                       |
| [`data/README.md`](data/README.md)                                                 | The network files, the zones and the reference voyages                                                  |
| [`docs/searoute-architecture-analysis.md`](docs/searoute-architecture-analysis.md) | Deep-dive on Eurostat's SeaRoute, the Java project this is architecturally inspired by (not a port of) |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                                               | How to propose and submit a change                                                                      |

## Tech Stack

| Concern            | Choice                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| Language           | TypeScript (strict mode)                                                  |
| Runtime            | Node.js 22+                                                               |
| Package management | npm workspaces (no pnpm, no Docker)                                       |
| Testing            | [Vitest](https://vitest.dev)                                              |
| Linting            | [ESLint](https://eslint.org) 9 (flat config) + `typescript-eslint`        |
| Formatting         | [Prettier](https://prettier.io)                                           |
| API contract       | Hand-maintained [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) spec  |

## Project Structure

```
ShipRouteX/
├── packages/
│   ├── core/                 Routing domain logic: network loading, route calculation, ECA and piracy zones; framework-independent
│   ├── graph/                Generic Node/Edge/Graph + GraphLoader/GraphCache + heap-based Dijkstra; no maritime knowledge
│   └── shared/               Cross-cutting types + geo utilities (Coordinate, haversineKm)
├── data/
│   ├── networks/             The real network at 5, 10, 20, 50 and 100 km (converted from SeaRoute, EUPL)
│   ├── zones/                ECA and piracy-risk polygons
│   ├── seed/                 Small hand-authored test fixture
│   └── reference/            Reference voyages
├── modules/                  The Eurostat SeaRoute Java fork (EUPL)
├── docs/                     Architecture, API reference, SeaRoute analysis
├── openapi.json              OpenAPI 3.1 spec for the API
└── .github/workflows/        CI pipeline (lint, build, test)
```

The website, the API (Netlify), the usage logging and the auth and API-key interfaces are in the private `shiproutex-web-api` repository, which installs this repo as a Git submodule. Dependency direction is one-way: `core → graph → shared`, and nothing here depends on the API.

## Roadmap

**Done:**

- [x] Graph engine (`Node`/`Edge`/`Graph`/`GraphLoader`/`GraphCache`) with binary-heap Dijkstra, loaded once and cached per resolution
- [x] The real SeaRoute-derived network at five resolutions, checked against the Java version
- [x] `calculateRoute()`/`computeRoute()`: nearest-node snapping, chokepoint avoidance (`RouteOptions.avoid`), distance calculation, GeoJSON generation, rich metadata
- [x] ECA and piracy-risk zone analysis along a route
- [x] A typed error hierarchy (`ROUTE_VALIDATION_ERROR`/`ROUTE_NOT_FOUND`/`NETWORK_UNAVAILABLE`)

**Next:**

- [ ] A spatial index for nearest-node lookups (currently a documented, intentional linear scan)
- [ ] Antimeridian (±180°) handling in `calculateRoute()`
- [ ] Canadian Arctic and Norwegian Sea ECAs (see `data/zones/README.md`)

## Contributing

Issues and PRs are welcome, see [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, conventions, and what to run before opening a PR (`npm run build && npm run lint && npm run format:check && npm test`).

## Acknowledgments

ShipRoutesX's architecture is **inspired by** Eurostat's [SeaRoute](https://github.com/eurostat/searoute) (EUPL-1.2), a Java project that computes shortest maritime routes over a pre-built graph using Dijkstra's algorithm. ShipRoutesX is **not** a port or translation of that codebase; see [`docs/searoute-architecture-analysis.md`](docs/searoute-architecture-analysis.md) for the analysis this project's design decisions are based on. ShipRoutesX is also intended to power sibling AIFlare tools that need maritime distance/route data.

## License

Two licences apply, by directory:

- **MIT** ([LICENSE](LICENSE)), © 2026 AIFlare: the ShipRoutesX TypeScript code (`packages/`, `docs/`).
- **EUPL v1.2** ([LICENSE-EUPL](LICENSE-EUPL)): the Eurostat SeaRoute fork in `modules/`, and the sea network data converted from it (`data/networks/`, `data/reference/`). EUPL code and data cannot be relicensed.
