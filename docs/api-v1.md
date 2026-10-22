# ShipRouteX public API (v1, deployed on Netlify)

This is the API that is deployed. It follows the shared X dataset API template: read-only GET, CORS `*`, JSON errors, `client` on every endpoint, usage logging, `/api/stats`. The API code and its deployment are kept in a separate private repository; the routing engine and data it serves are in this repo.

Base path `/api/v1`. Engine and zone logic: `packages/core`.

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

## Usage logging

Each call is recorded anonymously (time, endpoint, `from`, `to`, `avoid`, `allow`, `resolution`, `client`, calling site, country; no IP, user agent or cookies). `from` and `to` are logged as typed, so a `lat,lon` input is stored as given.
