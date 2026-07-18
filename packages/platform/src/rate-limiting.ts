/**
 * Rate Limiting — capping how many requests a developer/API key can make in
 * a window of time. Would run after authentication succeeds, keyed by
 * whatever `AuthContext` resolves to (see docs/platform-architecture.md).
 */

export interface RateLimitResult {
  /** Whether this request is allowed to proceed. */
  allowed: boolean;
  /** The configured limit for the current window. */
  limit: number;
  /** Requests remaining in the current window after this one. */
  remaining: number;
  /** ISO 8601 timestamp the current window resets at. */
  resetAt: string;
}

export interface RateLimiter {
  /** Checks (and records) one request against a subject's rate limit. */
  consume(subjectId: string): Promise<RateLimitResult>;
}

/**
 * An in-memory, single-process fixed-window `RateLimiter`. Functionally
 * real (it actually enforces `limitPerWindow` requests per `windowMs` per
 * subject), but only within one process — a production implementation
 * needs a shared store (e.g. Redis) so the limit holds across every
 * instance of a horizontally-scaled API, which this does not attempt.
 */
export class MockRateLimiter implements RateLimiter {
  private readonly limitPerWindow: number;
  private readonly windowMs: number;
  private readonly windowStartBySubject = new Map<string, number>();
  private readonly countBySubject = new Map<string, number>();

  constructor(limitPerWindow = 60, windowMs = 60_000) {
    this.limitPerWindow = limitPerWindow;
    this.windowMs = windowMs;
  }

  async consume(subjectId: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = this.windowStartBySubject.get(subjectId);

    if (windowStart === undefined || now - windowStart >= this.windowMs) {
      this.windowStartBySubject.set(subjectId, now);
      this.countBySubject.set(subjectId, 1);
      return Promise.resolve({
        allowed: true,
        limit: this.limitPerWindow,
        remaining: this.limitPerWindow - 1,
        resetAt: new Date(now + this.windowMs).toISOString(),
      });
    }

    const count = (this.countBySubject.get(subjectId) ?? 0) + 1;
    this.countBySubject.set(subjectId, count);

    return Promise.resolve({
      allowed: count <= this.limitPerWindow,
      limit: this.limitPerWindow,
      remaining: Math.max(0, this.limitPerWindow - count),
      resetAt: new Date(windowStart + this.windowMs).toISOString(),
    });
  }
}
