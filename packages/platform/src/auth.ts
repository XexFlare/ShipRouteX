/**
 * Authentication — verifying *who* is making a request.
 *
 * Real authentication is explicitly NOT implemented yet (see
 * docs/platform-architecture.md for the planned flow). This module exists
 * so the rest of the platform (rate limiting, usage tracking) — and,
 * eventually, `apps/api`'s middleware — has a stable `Authenticator`
 * contract and an `AuthContext` shape to depend on before a real
 * implementation exists.
 */

/** The result of attempting to authenticate a request. */
export interface AuthContext {
  /** True if the request was successfully authenticated. */
  authenticated: boolean;
  /** The developer account this request is attributed to, if authenticated. */
  developerId?: string;
  /** The API key id used to authenticate, if authenticated via an API key. */
  apiKeyId?: string;
}

/**
 * Authenticates a request given a raw API key (or `undefined` if none was
 * supplied). A real implementation will look the key up via
 * `ApiKeyService`, check it's active, and resolve it to a developer account.
 */
export interface Authenticator {
  authenticate(apiKey: string | undefined): Promise<AuthContext>;
}

/**
 * A no-op stand-in for `Authenticator`. Authenticates every request as a
 * single fixed mock developer, regardless of the API key supplied (or its
 * absence) — it never rejects a request.
 *
 * This is deliberate: real authentication is out of scope for now (see the
 * module docs above), and this mock exists purely so code that depends on
 * `Authenticator` (rate limiting, usage tracking, and eventually
 * `apps/api`'s auth middleware) has something to call. Swap this for a real
 * implementation (API-key lookup + hashing + expiry checks) when
 * authentication actually ships — nothing that depends on the
 * `Authenticator` interface should need to change.
 */
export class MockAuthenticator implements Authenticator {
  async authenticate(_apiKey: string | undefined): Promise<AuthContext> {
    return Promise.resolve({
      authenticated: true,
      developerId: 'mock-developer',
      apiKeyId: 'mock-api-key',
    });
  }
}
