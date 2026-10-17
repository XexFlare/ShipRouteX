import { describe, expect, it } from 'vitest';
import { analyzeRoute, zonesAt, ZONES } from './zones';
import { etaDays, kmToNm } from './voyage';

describe('zones', () => {
  it('has unique ids and usable rings', () => {
    expect(new Set(ZONES.map((z) => z.id)).size).toBe(ZONES.length);
    for (const z of ZONES) expect(z.ring.length).toBeGreaterThanOrEqual(3);
  });

  it('finds the right zone for known sea positions', () => {
    const at = (lon: number, lat: number) => zonesAt({ lon, lat }).map((z) => z.id);
    expect(at(2.0, 54.0)).toContain('eca-north-sea'); // central North Sea
    expect(at(1.5, 50.5)).toContain('eca-north-sea'); // English Channel
    expect(at(19, 57)).toContain('eca-baltic'); // central Baltic
    expect(at(15, 38)).toContain('eca-mediterranean'); // Ionian Sea
    expect(at(-74, 38)).toContain('eca-north-america-atlantic'); // off New Jersey
    expect(at(-125, 38)).toContain('eca-north-america-pacific'); // off California
    expect(at(48, 12)).toContain('piracy-somali-indian-ocean'); // Gulf of Aden
    expect(at(3, 3)).toContain('piracy-gulf-of-guinea');
  });

  it('keeps open ocean and the Black Sea outside every zone', () => {
    expect(zonesAt({ lon: -30, lat: 35 })).toEqual([]); // mid Atlantic
    expect(zonesAt({ lon: 35, lat: 43 })).toEqual([]); // Black Sea
    expect(zonesAt({ lon: 80, lat: -20 })).toEqual([]); // Indian Ocean south of the piracy area
  });

  it('does not treat the Skagerrak as Baltic or the Bay of Biscay as North Sea', () => {
    expect(zonesAt({ lon: 9.5, lat: 58.5 }).map((z) => z.id)).not.toContain('eca-baltic');
    expect(zonesAt({ lon: -6, lat: 46 }).map((z) => z.id)).not.toContain('eca-north-sea');
  });

  it('respects ECA start dates', () => {
    expect(zonesAt({ lon: 15, lat: 38 }, new Date('2024-01-01'))).toEqual([]);
    expect(zonesAt({ lon: 15, lat: 38 }, new Date('2025-06-01')).map((z) => z.id)).toContain(
      'eca-mediterranean',
    );
  });
});

describe('analyzeRoute', () => {
  it('measures a straight line across the Baltic', () => {
    // 15 E to 21 E along 56 N: 6 degrees of longitude at 56 N is about 373 km
    const result = analyzeRoute([
      [15, 56],
      [21, 56],
    ]);
    expect(result.ecaDistanceKm).toBeGreaterThan(360);
    expect(result.ecaDistanceKm).toBeLessThan(385);
    expect(result.zones[0]?.id).toBe('eca-baltic');
    expect(result.piracyDistanceKm).toBe(0);
  });

  it('counts only the part of a route inside a zone', () => {
    // From the open Atlantic into the Channel: only the part east of 5 W counts
    const result = analyzeRoute([
      [-10, 49.5],
      [0, 49.5],
    ]);
    const inside = 5 * 111.19 * Math.cos((49.5 * Math.PI) / 180);
    expect(result.ecaDistanceKm).toBeGreaterThan(inside * 0.97);
    expect(result.ecaDistanceKm).toBeLessThan(inside * 1.03);
  });

  it('survives a hop over the antimeridian', () => {
    const result = analyzeRoute([
      [179.99, 0],
      [-179.99, 0],
    ]);
    expect(result.ecaDistanceKm).toBe(0);
  });
});

describe('voyage helpers', () => {
  it('converts distance and ETA', () => {
    expect(kmToNm(1852)).toBeCloseTo(1000, 6);
    // 12 knots covers 288 nm a day, so 2880 nm takes 10 days
    expect(etaDays(2880 * 1.852, 12)).toBeCloseTo(10, 6);
    expect(etaDays(1000, 0)).toBeNull();
  });
});
