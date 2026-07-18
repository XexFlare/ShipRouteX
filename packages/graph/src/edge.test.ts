import { describe, expect, it } from 'vitest';
import { Edge } from './edge';

describe('Edge', () => {
  it('exposes its fields, defaulting pass to null when omitted', () => {
    const edge = new Edge({ id: 'e1', from: 'a', to: 'b', distanceKm: 100 });

    expect(edge.id).toBe('e1');
    expect(edge.fromNodeId).toBe('a');
    expect(edge.toNodeId).toBe('b');
    expect(edge.distanceKm).toBe(100);
    expect(edge.pass).toBeNull();
  });

  it('preserves an explicit pass name', () => {
    const edge = new Edge({ id: 'e1', from: 'a', to: 'b', distanceKm: 100, pass: 'suez' });

    expect(edge.pass).toBe('suez');
  });

  it('is immutable', () => {
    const edge = new Edge({ id: 'e1', from: 'a', to: 'b', distanceKm: 100 });

    expect(() => {
      (edge as { distanceKm: number }).distanceKm = 0;
    }).toThrow();
  });

  describe('otherNodeId', () => {
    const edge = new Edge({ id: 'e1', from: 'a', to: 'b', distanceKm: 100 });

    it('returns the "to" node when given the "from" node', () => {
      expect(edge.otherNodeId('a')).toBe('b');
    });

    it('returns the "from" node when given the "to" node', () => {
      expect(edge.otherNodeId('b')).toBe('a');
    });
  });
});
