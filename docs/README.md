# Documentation

- [`architecture.md`](architecture.md) — how ShipRoutesX itself is built: package boundaries, the request lifecycle for `POST /route`, the network data model, and a table of key design decisions and why.
- [`installation.md`](installation.md) — prerequisites, setup, verifying your environment, troubleshooting.
- [`development.md`](development.md) — day-to-day commands, where different kinds of changes belong, testing conventions.
- [`api.md`](api.md) — full endpoint reference: every request/response shape and error code. See also [`../openapi.json`](../openapi.json) (machine-readable, also served at `GET /openapi.json`) and [`examples/`](examples/) (real request/response pairs).
- [`platform-architecture.md`](platform-architecture.md) — how ShipRoutesX is being prepared to become the first API inside the AIFlare platform: the planned authentication/API-keys/rate-limiting/usage-tracking flow, why it lives in its own package (`packages/platform`) the routing engine can't see, and what's mocked vs. real today.
- [`searoute-architecture-analysis.md`](searoute-architecture-analysis.md) — deep-dive analysis of Eurostat's [SeaRoute](https://github.com/eurostat/searoute) project: architecture, routing algorithm, data model, and a set of recommendations for ShipRoutesX. This is the architectural reference ShipRoutesX is **inspired by** — it is not a port or translation of the Java code.
