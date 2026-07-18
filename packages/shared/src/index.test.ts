import { describe, expect, it } from 'vitest';
import { SHARED_PACKAGE_NAME, type Coordinate } from './index';

describe('@shiproutesx/shared', () => {
  it('exposes its package name', () => {
    expect(SHARED_PACKAGE_NAME).toBe('@shiproutesx/shared');
  });

  it('types a Coordinate as lon/lat', () => {
    const coordinate: Coordinate = { lon: 5.3, lat: 43.3 };
    expect(coordinate.lon).toBe(5.3);
    expect(coordinate.lat).toBe(43.3);
  });
});
