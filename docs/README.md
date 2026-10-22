# Documentation

- [`architecture.md`](architecture.md): how the engine is built: package boundaries, the network data model, and a table of key design decisions and why.
- [`api-v1.md`](api-v1.md): reference for the deployed routing API (`/api/v1`). See also [`../openapi.json`](../openapi.json) (machine-readable).
- [`searoute-architecture-analysis.md`](searoute-architecture-analysis.md): deep-dive analysis of Eurostat's [SeaRoute](https://github.com/eurostat/searoute) project: architecture, routing algorithm, data model, and a set of recommendations for ShipRoutesX. This is the architectural reference ShipRoutesX is **inspired by**; it is not a port or translation of the Java code.

The website, the API deployment, the local development server and the (mocked) auth and API-key platform are documented in the separate private repository.
