/**
 * ShipRoutesX platform services — the account/access-control layer for
 * ShipRoutesX as the first API in the AIFlare platform.
 *
 * Every module here is an interface plus a mock (in-memory) implementation
 * ONLY — there is no real authentication, persistence, or distributed rate
 * limiting yet. See docs/platform-architecture.md for the planned flow and
 * what a production implementation of each interface would need.
 *
 * This package has no dependency on `@shiproutesx/core` or
 * `@shiproutesx/graph`, and neither of those packages depends on this one
 * — the routing engine is completely unaware that authentication,
 * rate limiting, or usage tracking exist.
 */

export { type AuthContext, type Authenticator, MockAuthenticator } from './auth';

export { type ApiKey, type ApiKeyService, type CreatedApiKey, MockApiKeyService } from './api-keys';

export { type RateLimitResult, type RateLimiter, MockRateLimiter } from './rate-limiting';

export { type UsageEvent, type UsageTracker, MockUsageTracker } from './usage-tracking';

export {
  type CreateDeveloperAccountInput,
  type DeveloperAccount,
  type DeveloperAccountService,
  type DeveloperPlan,
  MockDeveloperAccountService,
} from './developer-accounts';
