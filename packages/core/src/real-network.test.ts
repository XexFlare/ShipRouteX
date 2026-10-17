import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { GraphLoader, type Graph, type ResolutionKm } from '@shiproutesx/graph';
import { beforeAll, describe, expect, it } from 'vitest';

import { calculateRoute } from './route';
import { PASS_NAMES, type PassName } from './route-options';

const dataDir = fileURLToPath(new URL('../../../data', import.meta.url));

interface ReferenceVoyage {
  name: string;
  origin: [number, number];
  destination: [number, number];
  avoid: PassName[];
  distanceKm: number;
  passes: string[];
  originNode: [number, number];
  destinationNode: [number, number];
}

const reference = JSON.parse(readFileSync(`${dataDir}/reference/voyages.json`, 'utf-8')) as {
  resolutions: Record<string, ReferenceVoyage[]>;
};

// The reference is data/scripts/reference-routes.py, an independent re-implementation of the
// Java SeaRouting algorithm over the same GeoPackage files. Planar-degree snapping (Java) and
// haversine snapping (here) can pick different end nodes for a port on the coarse grids. When both
// snap to the same nodes the result must match (the shortest path is unique); when they do not,
// only a loose distance check applies.
const SAME_SNAP_TOLERANCE = 0.001;
const DIFFERENT_SNAP_TOLERANCE = 0.05;

describe.each([20, 100] as ResolutionKm[])('real SeaRoute network at %ikm', (resolutionKm) => {
  let graph: Graph;

  beforeAll(async () => {
    graph = await GraphLoader.fromFile(`${dataDir}/networks/${resolutionKm}km.json`);
  });

  it('loads as a large connected-looking network, not the starter data', () => {
    expect(graph.resolutionKm).toBe(resolutionKm);
    expect([...graph.nodes()].length).toBeGreaterThan(1000);
  });

  it.each(reference.resolutions[String(resolutionKm)] ?? [])(
    'matches the Java-semantics reference: $name',
    (voyage) => {
      const result = calculateRoute(
        graph,
        {
          origin: { lon: voyage.origin[0], lat: voyage.origin[1] },
          destination: { lon: voyage.destination[0], lat: voyage.destination[1] },
        },
        { avoid: voyage.avoid },
      );
      const sameNode = (a: { lon: number; lat: number }, b: [number, number]) =>
        a.lon === b[0] && a.lat === b[1];
      const sameSnap =
        sameNode(result.metadata.origin.coordinate, voyage.originNode) &&
        sameNode(result.metadata.destination.coordinate, voyage.destinationNode);
      const relativeError = Math.abs(result.distanceKm - voyage.distanceKm) / voyage.distanceKm;
      if (sameSnap) {
        expect(relativeError).toBeLessThan(SAME_SNAP_TOLERANCE);
        expect(result.metadata.passesUsed).toEqual(voyage.passes);
      } else {
        expect(relativeError).toBeLessThan(DIFFERENT_SNAP_TOLERANCE);
      }
    },
  );

  it('keeps the Java test expectation: Marseille to Shanghai without Suez is 23,000 to 28,000 km', () => {
    const result = calculateRoute(
      graph,
      { origin: { lon: 5.3, lat: 43.3 }, destination: { lon: 121.8, lat: 31.2 } },
      { avoid: ['suez', 'kiel', 'corinth', 'northwest', 'northeast'] },
    );
    expect(result.distanceKm).toBeGreaterThan(23000);
    expect(result.distanceKm).toBeLessThan(28000);
  });

  it('routes across the antimeridian through the round-the-globe links', () => {
    const result = calculateRoute(
      graph,
      { origin: { lon: 103.85, lat: 1.26 }, destination: { lon: -118.25, lat: 33.7 } },
      { avoid: ['kiel', 'corinth', 'northwest', 'northeast'] },
    );
    const lons = result.geometry.coordinates.map(([lon]) => lon);
    expect(Math.max(...lons)).toBeGreaterThan(170);
    expect(Math.min(...lons)).toBeLessThan(-170);
    expect(result.distanceKm).toBeLessThan(16000);
  });

  it('tags every pass name SeaRoute uses', () => {
    const tagged = new Set([...graph.edges()].map((edge) => edge.pass).filter(Boolean));
    for (const pass of PASS_NAMES) expect(tagged.has(pass)).toBe(true);
  });
});
