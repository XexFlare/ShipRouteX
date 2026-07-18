import type { NetworkNodeData } from './types';

/** A single point in the network graph. Immutable once constructed. */
export class Node {
  readonly id: string;
  readonly lon: number;
  readonly lat: number;

  constructor(data: NetworkNodeData) {
    this.id = data.id;
    this.lon = data.lon;
    this.lat = data.lat;
    Object.freeze(this);
  }
}
