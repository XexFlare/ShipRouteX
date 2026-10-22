# Data

## `networks/{5,10,20,50,100}km.json`

The real SeaRoute sea network, one file per resolution, converted from Eurostat's `marnet_plus_*km.gpkg` GeoPackages in `modules/core/src/main/resources/marnet`. EUPL v1.2 (see [`networks/LICENSE.md`](networks/LICENSE.md)).

| Resolution | Nodes | Edges |
|---|---|---|
| 5 km | 42,334 | 78,706 |
| 10 km | 26,928 | 51,956 |
| 20 km | 16,231 | 31,781 |
| 50 km | 8,426 | 16,549 |
| 100 km | 5,252 | 10,423 |

Shape (the format `packages/graph` loads, unchanged):

```json
{
  "resolutionKm": 20,
  "nodes": [{ "id": "n0", "lon": 5.3, "lat": 43.3 }],
  "edges": [{ "id": "e1", "from": "n0", "to": "n1", "distanceKm": 12.345, "pass": null }]
}
```

How the conversion follows the Java `SeaRouting` graph:

- Each GeoPackage line is an edge between its two end points; end points with identical coordinates are one node. A line with intermediate vertices becomes a chain of edges through private vertex nodes (`v<fid>_<k>`), so route geometry keeps its real shape and the topology stays the same as Java's.
- Edges keep their `pass` tag: `suez`, `panama`, `malacca`, `gibraltar`, `dover`, `bering`, `magellan`, `babelmandeb`, `kiel`, `corinth`, `northwest`, `northeast`.
- Nodes at longitude 180 are linked to the node at -180 (`wrap<n>` edges) so routes can cross the antimeridian. The engine needs positive distances, so these links and the few zero-length lines get 0.0001 km.
- Distances are haversine on a 6371 km sphere. Java uses the WGS84 geodesic, so totals differ by up to about 0.5 percent.

Regenerate (needs Node 22.5 or newer for `node:sqlite`):

```bash
node --no-warnings data/scripts/convert-searoute-network.mjs        # all five
node --no-warnings data/scripts/convert-searoute-network.mjs 20 100 # chosen resolutions
```

## Java default avoid list

`SeaRouting.getRoute(oLon, oLat, dLon, dLat)` blocks `kiel`, `corinth`, `northwest` and `northeast` and allows every other pass. The TypeScript engine blocks nothing by default, so pass `avoid: ["kiel", "corinth", "northwest", "northeast"]` to match Java. The routing API (C17) should make that its default.

## `reference/voyages.json`

Expected results for 14 known voyages at 20 km and 100 km, produced by `scripts/reference-routes.py`. That script re-implements the Java algorithm straight from the GeoPackages (one edge per line, planar nearest-node snapping, Dijkstra, zero-weight antimeridian links), independent of the converter and the engine. Run it with `python -I data/scripts/reference-routes.py`. The engine test `packages/core/src/real-network.test.ts` compares against it: when both snap to the same nodes the distance must agree within 0.1 percent and the passes must be identical.

A JDK was not available when this was built, so the Java code itself has not been run. To confirm against real Java output, run `modules/jar` on the same coordinates and compare with this file.

## `seed/`

The small hand-authored starter network (about 20 waypoints) and its generator. It is only a unit-test fixture: the `packages/core` Vitest config (and the private API's) points `SHIPROUTESX_DATA_DIR` at `data/seed` so their tests keep exact, hand-checkable distances.
