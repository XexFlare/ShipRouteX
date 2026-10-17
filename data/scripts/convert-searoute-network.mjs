// Converts SeaRoute's real marnet_plus_<N>km.gpkg GeoPackages (modules/core/src/main/resources/marnet)
// into the ShipRoutesX network JSON format (data/networks/<N>km.json). No engine changes needed.
//
// Mirrors how the Java SeaRouting builds its graph:
//  - every GeoPackage line is an edge between its two end points; end points with identical
//    coordinates are one node
//  - the edge keeps its "pass" tag (suez, panama, ...)
//  - nodes at lon 180 are linked to the node at lon -180 with a zero-weight edge (round the globe)
// One deliberate difference: a line with intermediate vertices becomes a chain of edges through
// private vertex nodes (never shared with other lines), so the route geometry keeps its real
// shape and the topology stays identical to Java's.
//
// Usage: node data/scripts/convert-searoute-network.mjs [resolution ...]   (default: all five)
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const gpkgDir = path.join(repoRoot, 'modules/core/src/main/resources/marnet');
const outDir = path.join(repoRoot, 'data/networks');

const EARTH_RADIUS_KM = 6371; // same as packages/shared haversineKm
/** The engine requires every edge distance to be positive. Round-the-globe links and zero-length
 *  lines (weight 0 in Java) get 0.1 m instead, which is neutral for any real route. */
const MIN_EDGE_KM = 0.0001;

export function haversineKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Parses a GeoPackage geometry blob holding a WKB LineString into [[lon, lat], ...]. */
export function parseGpkgLineString(blob) {
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const flags = view.getUint8(3);
  const envelopeBytes = [0, 32, 48, 48, 64][(flags >> 1) & 7];
  let offset = 8 + envelopeBytes;
  const little = view.getUint8(offset) === 1;
  const type = view.getUint32(offset + 1, little);
  if (type !== 2) throw new Error(`Expected a WKB LineString, got type ${type}`);
  const count = view.getUint32(offset + 5, little);
  offset += 9;
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push([view.getFloat64(offset, little), view.getFloat64(offset + 8, little)]);
    offset += 16;
  }
  return points;
}

export function convert(resolutionKm) {
  const db = new DatabaseSync(path.join(gpkgDir, `marnet_plus_${resolutionKm}km.gpkg`), { readOnly: true });
  const rows = db.prepare('SELECT fid, geometry, pass FROM type ORDER BY fid').all();
  db.close();

  const nodes = [];
  const edges = [];
  const endpointIds = new Map(); // "lon,lat" -> node id

  const endpoint = ([lon, lat]) => {
    const key = `${lon},${lat}`;
    let id = endpointIds.get(key);
    if (id === undefined) {
      id = `n${endpointIds.size}`;
      endpointIds.set(key, id);
      nodes.push({ id, lon, lat });
    }
    return id;
  };

  for (const row of rows) {
    const points = parseGpkgLineString(row.geometry);
    if (points.length < 2) continue;
    const pass = row.pass ?? null;

    let from = endpoint(points[0]);
    let prev = points[0];
    for (let k = 1; k < points.length; k++) {
      const last = k === points.length - 1;
      const to = last ? endpoint(points[k]) : `v${row.fid}_${k}`;
      if (!last) nodes.push({ id: to, lon: points[k][0], lat: points[k][1] });
      const distanceKm = haversineKm({ lon: prev[0], lat: prev[1] }, { lon: points[k][0], lat: points[k][1] });
      edges.push({
        id: points.length === 2 ? `e${row.fid}` : `e${row.fid}_${k}`,
        from,
        to,
        distanceKm: Math.max(Math.round(distanceKm * 1000) / 1000, MIN_EDGE_KM),
        pass,
      });
      from = to;
      prev = points[k];
    }
  }

  // Round the globe: link every node at lon 180 to the node at lon -180 (same latitude, else nearest).
  const antimeridian = [...endpointIds].filter(([key]) => key.startsWith('180,'));
  let wrapCount = 0;
  for (const [key, id] of antimeridian) {
    const lat = Number(key.split(',')[1]);
    const westKey = `-180,${lat}`;
    let target = endpointIds.get(westKey);
    if (target === undefined) {
      let best = Infinity;
      for (const [k, other] of endpointIds) {
        const [x, y] = k.split(',').map(Number);
        const d = (x + 180) ** 2 + (y - lat) ** 2;
        if (d < best) {
          best = d;
          target = other;
        }
      }
    }
    edges.push({ id: `wrap${wrapCount++}`, from: id, to: target, distanceKm: MIN_EDGE_KM, pass: null });
  }

  return { resolutionKm, nodes, edges };
}

function main() {
  const requested = process.argv.slice(2).map(Number);
  const resolutions = requested.length > 0 ? requested : [5, 10, 20, 50, 100];
  mkdirSync(outDir, { recursive: true });
  for (const resolutionKm of resolutions) {
    const data = convert(resolutionKm);
    const file = path.join(outDir, `${resolutionKm}km.json`);
    writeFileSync(file, JSON.stringify(data));
    console.log(`${resolutionKm}km: ${data.nodes.length} nodes, ${data.edges.length} edges -> ${path.relative(repoRoot, file)}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
