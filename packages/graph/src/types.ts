/** Supported maritime network resolutions, in kilometers (matches the tiers documented in docs/searoute-architecture-analysis.md, §5). */
export const RESOLUTIONS_KM = [5, 10, 20, 50, 100] as const;

export type ResolutionKm = (typeof RESOLUTIONS_KM)[number];

export function isResolutionKm(value: unknown): value is ResolutionKm {
  return typeof value === 'number' && (RESOLUTIONS_KM as readonly number[]).includes(value);
}

/** Formats a resolution for display/API responses, e.g. `20` -> `"20km"`. */
export function formatResolution(resolutionKm: ResolutionKm): string {
  return `${resolutionKm}km`;
}

/** Raw node record as stored in a network data file. */
export interface NetworkNodeData {
  id: string;
  lon: number;
  lat: number;
}

/** Raw edge record as stored in a network data file. */
export interface NetworkEdgeData {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  pass?: string | null;
}

/** The raw, serializable shape of a maritime network file. */
export interface NetworkData {
  resolutionKm: ResolutionKm;
  nodes: NetworkNodeData[];
  edges: NetworkEdgeData[];
}
