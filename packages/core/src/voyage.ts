import type { PassName } from './route-options';

/** Nautical mile in kilometres. */
export const KM_PER_NM = 1.852;

/**
 * Passes blocked unless a caller allows them, matching the Java SeaRoute default
 * (`SeaRouting.getRoute` with four arguments): Kiel, Corinth and the two Arctic routes.
 */
export const DEFAULT_AVOID: readonly PassName[] = ['kiel', 'corinth', 'northwest', 'northeast'];

export function kmToNm(km: number): number {
  return km / KM_PER_NM;
}

/** Days at sea at a steady speed in knots; null when the speed is not positive. */
export function etaDays(distanceKm: number, speedKnots: number): number | null {
  if (!Number.isFinite(speedKnots) || speedKnots <= 0) return null;
  return distanceKm / KM_PER_NM / speedKnots / 24;
}
