/**
 * Cross-cutting types and pure utilities shared by the routing engine
 * (`@shiproutesx/graph`, `@shiproutesx/core`) and any transport layer
 * (`apps/api`). No domain logic, no framework dependencies.
 */

export const SHARED_PACKAGE_NAME = '@shiproutesx/shared';

export { type Coordinate } from './types';
export { haversineKm } from './geo';
