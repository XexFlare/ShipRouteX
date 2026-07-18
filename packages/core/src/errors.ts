/**
 * Base class for every error `calculateRoute`/`computeRoute` can throw.
 * Every concrete subclass carries a stable `code` string so a caller (an API
 * layer, a CLI, ...) can branch on error *kind* — to pick an HTTP status
 * code, for instance — without parsing message text.
 */
export abstract class RouteCalculationError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

/**
 * The request itself was invalid: a malformed coordinate, an unknown name in
 * `RouteOptions.avoid`, or `RouteOptions.resolutionKm` disagreeing with the
 * `Graph` it was passed alongside.
 */
export class RouteValidationError extends RouteCalculationError {
  readonly code = 'ROUTE_VALIDATION_ERROR';
}

/**
 * The request was well-formed, but no path connects the snapped origin and
 * destination — including when they're only connected through a pass listed
 * in `RouteOptions.avoid`.
 */
export class RouteNotFoundError extends RouteCalculationError {
  readonly code = 'ROUTE_NOT_FOUND';
}

/**
 * No maritime network data is available for the requested resolution (e.g.
 * `data/networks/10km.json` doesn't exist). Distinct from
 * `RouteValidationError` because the *resolution value* is valid — the
 * *data* for it just isn't there yet.
 */
export class NetworkUnavailableError extends RouteCalculationError {
  readonly code = 'NETWORK_UNAVAILABLE';
}
