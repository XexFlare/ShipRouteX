import { describe, expect, it } from 'vitest';
import { Node } from './node';

describe('Node', () => {
  it('exposes id/lon/lat from the data it was built from', () => {
    const node = new Node({ id: 'marseille', lon: 5.3, lat: 43.3 });

    expect(node.id).toBe('marseille');
    expect(node.lon).toBe(5.3);
    expect(node.lat).toBe(43.3);
  });

  it('is immutable', () => {
    const node = new Node({ id: 'marseille', lon: 5.3, lat: 43.3 });

    expect(() => {
      (node as { lon: number }).lon = 0;
    }).toThrow();
    expect(node.lon).toBe(5.3);
  });
});
