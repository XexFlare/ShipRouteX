import { describe, expect, it } from 'vitest';
import { MockUsageTracker } from './usage-tracking';

describe('MockUsageTracker', () => {
  it('records an event and returns it for the right developer', async () => {
    const tracker = new MockUsageTracker();
    const event = {
      developerId: 'dev_1',
      route: 'POST /route',
      timestamp: new Date().toISOString(),
    };

    await tracker.record(event);

    expect(await tracker.getEventsFor('dev_1')).toEqual([event]);
  });

  it('keeps events for different developers separate', async () => {
    const tracker = new MockUsageTracker();
    await tracker.record({
      developerId: 'dev_1',
      route: 'POST /route',
      timestamp: new Date().toISOString(),
    });
    await tracker.record({
      developerId: 'dev_2',
      route: 'GET /graph/stats',
      timestamp: new Date().toISOString(),
    });

    expect(await tracker.getEventsFor('dev_1')).toHaveLength(1);
    expect(await tracker.getEventsFor('dev_2')).toHaveLength(1);
  });

  it('returns an empty array for a developer with no recorded events', async () => {
    const tracker = new MockUsageTracker();
    expect(await tracker.getEventsFor('unknown-dev')).toEqual([]);
  });

  it('preserves insertion order', async () => {
    const tracker = new MockUsageTracker();
    await tracker.record({
      developerId: 'dev_1',
      route: 'POST /route',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    await tracker.record({
      developerId: 'dev_1',
      route: 'GET /graph/stats',
      timestamp: '2026-01-01T00:01:00.000Z',
    });

    const events = await tracker.getEventsFor('dev_1');
    expect(events.map((e) => e.route)).toEqual(['POST /route', 'GET /graph/stats']);
  });
});
