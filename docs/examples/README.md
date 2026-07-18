# Example Requests & Responses

Concrete, real request/response pairs for every case described in [`../api.md`](../api.md). All example values are real — computed by (or, for error cases, deliberately triggering) the actual routing engine against the shipped seed network, except where a file says otherwise.

Run `npm run dev` first (see [`../installation.md`](../installation.md)), then either:

- Open [`requests.http`](requests.http) in an editor with the [VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension (or JetBrains' built-in HTTP client) and click "Send Request" above any block, or
- `curl` a request file directly:
  ```bash
  curl -X POST http://localhost:3041/route \
    -H "Content-Type: application/json" \
    -d @docs/examples/requests/basic-route.json
  ```

| Request                                                               | Response                                                                     | What it demonstrates                                                                    |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`basic-route.json`](requests/basic-route.json)                       | [`basic-route.json`](responses/basic-route.json)                             | Default options — Marseille → Shanghai via Suez                                         |
| [`avoid-suez.json`](requests/avoid-suez.json)                         | [`avoid-suez.json`](responses/avoid-suez.json)                               | `options.avoid` — same two ports, ~11,000 km longer via Cape of Good Hope               |
| [`custom-resolution.json`](requests/custom-resolution.json)           | [`custom-resolution.json`](responses/custom-resolution.json)                 | `options.resolutionKm` — Los Angeles → New York over the 50km network                   |
| —                                                                     | [`graph-stats.json`](responses/graph-stats.json)                             | `GET /graph/stats` (no request body — it's a GET)                                       |
| [`invalid-coordinate.json`](requests/invalid-coordinate.json)         | [`error-validation.json`](responses/error-validation.json)                   | `400 ROUTE_VALIDATION_ERROR` — an out-of-range latitude                                 |
| [`unavailable-resolution.json`](requests/unavailable-resolution.json) | [`error-network-unavailable.json`](responses/error-network-unavailable.json) | `400 NETWORK_UNAVAILABLE` — 10km is a recognized resolution, just not one with data yet |
| —                                                                     | [`error-not-found.json`](responses/error-not-found.json)                     | `404 ROUTE_NOT_FOUND` — **illustrative**, see the note in that file                     |

See [`../../openapi.json`](../../openapi.json) (also served live at `GET /openapi.json`) for the same examples embedded in a machine-readable OpenAPI 3.1 document.
