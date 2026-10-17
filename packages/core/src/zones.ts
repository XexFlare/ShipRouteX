import { haversineKm, type Coordinate } from '@shiproutesx/shared';
import { ZONES, type Zone, type ZoneKind } from './zones-data';

export { ZONES, type Zone, type ZoneKind };

/** Longest straight piece of route tested at one point; shorter means a finer measurement. */
const STEP_KM = 5;

interface PreparedZone {
  zone: Zone;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

const PREPARED: PreparedZone[] = ZONES.map((zone) => {
  const lons = zone.ring.map((p) => p[0]);
  const lats = zone.ring.map((p) => p[1]);
  return {
    zone,
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
});

function inRing(ring: [number, number][], lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Whether a zone applies on a date (ECAs before their start date do not). */
export function zoneActiveOn(zone: Zone, asOf: Date): boolean {
  return !zone.effectiveFrom || asOf.getTime() >= Date.parse(zone.effectiveFrom);
}

/** All zones containing a point, as of a date. */
export function zonesAt(point: Coordinate, asOf: Date = new Date()): Zone[] {
  return PREPARED.filter(
    (p) =>
      point.lon >= p.minLon &&
      point.lon <= p.maxLon &&
      point.lat >= p.minLat &&
      point.lat <= p.maxLat &&
      zoneActiveOn(p.zone, asOf) &&
      inRing(p.zone.ring, point.lon, point.lat),
  ).map((p) => p.zone);
}

export interface ZoneExposure {
  id: string;
  name: string;
  kind: ZoneKind;
  status: Zone['status'];
  /** Route kilometres inside this zone. */
  distanceKm: number;
  approximate: boolean;
}

export interface ZoneAnalysis {
  /** Kilometres inside any ECA that is in force on the date. */
  ecaDistanceKm: number;
  /** Kilometres inside any piracy advisory area. */
  piracyDistanceKm: number;
  /** One entry per zone the route touches, longest first. */
  zones: ZoneExposure[];
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Measures how much of a route (a lon/lat polyline) lies inside each zone, by testing the middle of
 * every piece of at most STEP_KM along it. Accurate to about the step size per zone entry or exit,
 * which is far finer than the zone polygons themselves.
 */
export function analyzeRoute(
  coordinates: [number, number][],
  asOf: Date = new Date(),
): ZoneAnalysis {
  const totals = new Map<string, number>();

  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1] as [number, number];
    const [lon2, lat2] = coordinates[i] as [number, number];
    const length = haversineKm({ lon: lon1, lat: lat1 }, { lon: lon2, lat: lat2 });
    if (length === 0) continue;

    // Interpolate the shorter way round, so a hop over the antimeridian stays short.
    let dLon = lon2 - lon1;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;

    const steps = Math.max(1, Math.ceil(length / STEP_KM));
    const stepKm = length / steps;
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      let lon = lon1 + dLon * t;
      if (lon > 180) lon -= 360;
      if (lon < -180) lon += 360;
      const lat = lat1 + (lat2 - lat1) * t;
      for (const zone of zonesAt({ lon, lat }, asOf)) {
        totals.set(zone.id, (totals.get(zone.id) ?? 0) + stepKm);
      }
    }
  }

  const zones: ZoneExposure[] = [...totals.entries()]
    .map(([id, km]) => {
      const zone = ZONES.find((z) => z.id === id) as Zone;
      return {
        id,
        name: zone.name,
        kind: zone.kind,
        status: zone.status,
        distanceKm: round1(km),
        approximate: zone.approximate,
      };
    })
    .sort((a, b) => b.distanceKm - a.distanceKm);

  const sum = (kind: ZoneKind) =>
    round1(zones.filter((z) => z.kind === kind).reduce((n, z) => n + z.distanceKm, 0));
  return { ecaDistanceKm: sum('eca'), piracyDistanceKm: sum('piracy'), zones };
}
