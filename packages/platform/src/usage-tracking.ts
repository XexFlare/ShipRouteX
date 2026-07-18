/**
 * Usage Tracking — recording what each developer/API key actually calls, for
 * billing, analytics, and abuse detection. Would run after a request
 * completes (see docs/platform-architecture.md).
 */

export interface UsageEvent {
  developerId: string;
  /** The API key used, if the request was authenticated via one. */
  apiKeyId?: string;
  /** e.g. "POST /route". */
  route: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Free-form extra detail (e.g. resolutionKm used, response status). */
  meta?: Record<string, unknown>;
}

export interface UsageTracker {
  record(event: UsageEvent): Promise<void>;
  /**
   * Returns recorded events for a developer, oldest first. This is here for
   * inspection and testing — a real implementation would expose proper
   * aggregation (requests per day, etc.) rather than a raw event list.
   */
  getEventsFor(developerId: string): Promise<UsageEvent[]>;
}

/**
 * An in-memory `UsageTracker`. Functionally real (records and returns
 * events exactly as given) but non-persistent and unbounded — a production
 * implementation needs a real event store/database and a retention policy,
 * neither of which this attempts.
 */
export class MockUsageTracker implements UsageTracker {
  private readonly events: UsageEvent[] = [];

  async record(event: UsageEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
  }

  async getEventsFor(developerId: string): Promise<UsageEvent[]> {
    return Promise.resolve(this.events.filter((event) => event.developerId === developerId));
  }
}
