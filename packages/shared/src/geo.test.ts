import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm({ lon: 5.3, lat: 43.3 }, { lon: 5.3, lat: 43.3 })).toBe(0);
  });

  it('matches the well-known ~111.19 km per degree of latitude', () => {
    const distance = haversineKm({ lon: 0, lat: 0 }, { lon: 0, lat: 1 });
    expect(distance).toBeCloseTo(111.19, 1);
  });

  it('is symmetric', () => {
    const a = { lon: 5.3, lat: 43.3 };
    const b = { lon: 121.8, lat: 31.2 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });

  it('computes a known great-circle distance (Marseille to Shanghai)', () => {
    const marseille = { lon: 5.3, lat: 43.3 };
    const shanghai = { lon: 121.8, lat: 31.2 };
    // Great-circle (as-the-crow-flies) distance, not a sailed route distance.
    expect(haversineKm(marseille, shanghai)).toBeCloseTo(9513, -1);
  });
});
