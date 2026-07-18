// Regenerates data/networks/{20,50,100}km.json — a small, hand-authored
// starter maritime network used while ShipRoutesX's own graph engine is
// built out.
//
// This is NOT the real SeaRoute-derived network (see
// docs/searoute-architecture-analysis.md, §17.1): it is ~20 real waypoints
// along well-known shipping lanes, connected by great-circle distances
// computed below, with a handful of named chokepoints tagged to match the
// "pass" concept documented in that analysis. It exists so the graph engine
// (GraphLoader/GraphCache/Graph) has real, non-trivial data to load and test
// against before the production network conversion happens.
//
// Multiple resolutions: SeaRoute's real network is generalized differently
// per resolution tier (coarser tiers collapse/simplify edges — see
// docs/searoute-architecture-analysis.md §5/§11). This starter dataset has
// no generalization pipeline behind it, so every resolution file below is
// currently IDENTICAL data under a different resolutionKm label — this
// exists so multi-resolution loading, caching, and API selection can be
// exercised end-to-end today. 5km and 10km are deliberately NOT generated,
// so requesting them exercises the "resolution unavailable" error path with
// real missing data rather than a mock.
//
// Run with: node data/scripts/generate-seed-network.mjs

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EARTH_RADIUS_KM = 6371;

/** @param {number} deg */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two (lon, lat) points, in kilometers.
 * @param {{ lon: number, lat: number }} a
 * @param {{ lon: number, lat: number }} b
 */
function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

// Real waypoints along major shipping lanes.
const NODES = {
  rotterdam: { lon: 4.47, lat: 51.9 },
  dover: { lon: 1.5, lat: 51.0 },
  gibraltar: { lon: -5.35, lat: 35.95 },
  marseille: { lon: 5.3, lat: 43.3 },
  piraeus: { lon: 23.6, lat: 37.9 },
  suezNorth: { lon: 32.35, lat: 31.26 },
  suezSouth: { lon: 32.55, lat: 29.93 },
  babElMandeb: { lon: 43.3, lat: 12.6 },
  mumbai: { lon: 72.8, lat: 18.9 },
  colombo: { lon: 79.85, lat: 6.93 },
  singapore: { lon: 103.8, lat: 1.3 },
  hongKong: { lon: 114.15, lat: 22.3 },
  shanghai: { lon: 121.8, lat: 31.2 },
  tokyo: { lon: 139.7, lat: 35.4 },
  auckland: { lon: 174.8, lat: -36.8 },
  losAngeles: { lon: -118.25, lat: 33.7 },
  vancouver: { lon: -123.1, lat: 49.3 },
  panamaPacific: { lon: -79.9, lat: 8.9 },
  panamaAtlantic: { lon: -79.9, lat: 9.35 },
  newYork: { lon: -74.0, lat: 40.7 },
  dakar: { lon: -17.45, lat: 14.7 },
  capeTown: { lon: 18.4, lat: -33.9 },
};

// [from, to, pass?] — pass names match the 12 named chokepoints documented
// in docs/searoute-architecture-analysis.md (§5).
const EDGES = [
  ['rotterdam', 'dover', null],
  ['dover', 'gibraltar', 'gibraltar'],
  ['gibraltar', 'marseille', null],
  ['marseille', 'piraeus', null],
  ['piraeus', 'suezNorth', null],
  ['suezNorth', 'suezSouth', 'suez'],
  ['suezSouth', 'babElMandeb', 'babelmandeb'],
  ['babElMandeb', 'colombo', null],
  ['colombo', 'mumbai', null],
  ['colombo', 'singapore', 'malacca'],
  ['singapore', 'hongKong', null],
  ['hongKong', 'shanghai', null],
  ['shanghai', 'tokyo', null],
  ['tokyo', 'auckland', null],
  ['tokyo', 'losAngeles', null],
  ['losAngeles', 'vancouver', null],
  ['losAngeles', 'panamaPacific', null],
  ['panamaPacific', 'panamaAtlantic', 'panama'],
  ['panamaAtlantic', 'newYork', null],
  ['newYork', 'rotterdam', null],
  ['gibraltar', 'dakar', null],
  ['dakar', 'capeTown', null],
  ['capeTown', 'mumbai', null],
];

const nodes = Object.entries(NODES).map(([id, coord]) => ({ id, lon: coord.lon, lat: coord.lat }));

const edges = EDGES.map(([from, to, pass], i) => ({
  id: `e${i + 1}`,
  from,
  to,
  distanceKm: haversineKm(NODES[from], NODES[to]),
  pass,
}));

const RESOLUTIONS_KM = [20, 50, 100];
const networksDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../networks');

for (const resolutionKm of RESOLUTIONS_KM) {
  const network = { resolutionKm, nodes, edges };
  const outPath = path.join(networksDir, `${resolutionKm}km.json`);
  await writeFile(outPath, `${JSON.stringify(network, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${nodes.length} nodes and ${edges.length} edges to ${outPath}`);
}
