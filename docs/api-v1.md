# ShipRouteX public API (v1, deployed on Netlify)

This is the API that is deployed. The Fastify server in `apps/api/src/app.ts` (`POST /route`, see [api.md](api.md)) is the local development server and is not deployed. The deployed API follows the shared X dataset API template (`DATASETS/ShipPortX/ShipPortX-Release/api/API_TEMPLATE.md`): read-only GET, CORS `*`, JSON errors, `client` on every endpoint, edge usage logging, `/api/stats`.

Base path `/api/v1`. Handler: `apps/api/src/handler.mjs`. Engine and zone logic: `packages/core`.

## `GET /api/v1/route`

| Parameter | Meaning |
|---|---|
| `from`, `to` (required) | A port id (ShipPortX such as `KE-mombasa`, or World Port Index such as `WPI-31140`) or `lat,lon` in decimal degrees |
| `speed_knots` | Adds `eta_days` and `eta_hours` (steady speed over the whole route) |
| `avoid` | Comma list of passes to block in addition to the defaults: `suez, panama, malacca, gibraltar, dover, bering, magellan, babelmandeb, kiel, corinth, northwest, northeast` |
| `allow` | Comma list of default-blocked passes to allow. `kiel`, `corinth`, `northwest` and `northeast` are blocked by default, as in Java SeaRoute |
| `resolution` | Network resolution in km: `5, 10, 20` (default), `50, 100`. Finer is slower and more detailed |
| `geometry` | `false` omits the GeoJSON LineString (default `true`) |
| `as_of` | Date (`2026-10-17`) for which ECA rules apply (default today) |
| `client` | Your app name, logged |

Response `data`: `distance_km`, `distance_nm`, `eta_*`, `passes_used`, `avoided`, `eca { distance_km, distance_nm, share, zones[], as_of }`, `piracy { distance_km, zones[] }`, `snapping`, `resolution_km`, `geometry`. Ship Fuel uses `eca.distance_km` to price MGO legs.

Errors: `port_not_found` (404), `route_not_found` (404, for example every way is blocked), `missing_parameter`, `invalid_parameter`, `unknown_parameter` (400), `network_unavailable` (503).

## Other endpoints

`GET /api/v1/zones[?kind=eca|piracy&geometry=true]`, `GET /api/v1/zones/{id}`, `GET /api/v1/zones/check?lat=&lon=`, `GET /api/v1/passes`, `GET /api/v1/metadata`, `GET /api/health`, `GET /api/stats` (bearer `STATS_TOKEN`).

## Zones

See [../data/zones/README.md](../data/zones/README.md). They are simplified polygons for estimates, not compliance advice.

## Usage logging and stats

Same as the dataset APIs: an edge function (`apps/api/netlify/edge-functions/api-log.mjs`) records one Firestore document per call before the CDN cache (time, endpoint, `from`, `to`, `avoid`, `allow`, `resolution`, `client`, calling site, country; no IP, user agent or cookies). `from` and `to` are logged as typed, so a `lat,lon` input is stored as given. An hourly function (`api-rollup.mjs`) builds summaries; `/stats/` shows them. Without `FIREBASE_SERVICE_ACCOUNT` the API serves routes and logs nothing.

## Deploy (user steps, minutes)

1. Netlify: new site from this repo, **Base directory** `apps/api` (settings come from `apps/api/netlify.toml`; the build runs `tsc -b` and stages the five network files).
2. Environment variables: `FIREBASE_SERVICE_ACCOUNT` (the same Firebase project as the other APIs) and `STATS_TOKEN`.
3. Firestore TTL policy on collection group `calls`, field `expireAt`, if not already set for another API.
4. Check `/api/health` (`resolutions_km` must list five values, proving the network files were found), then `/api/v1/route?from=KE-mombasa&to=WPI-31140&speed_knots=14&client=test`, and `/stats/` an hour later.

## Refreshing the port index

`node data/scripts/build-ports-index.mjs` rebuilds `apps/api/src/data/ports.generated.mjs` from the ShipPortX worldwide file (3,008 ports with coordinates).
