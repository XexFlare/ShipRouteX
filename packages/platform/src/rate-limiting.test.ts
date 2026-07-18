import { describe, expect, it } from 'vitest';
import { MockRateLimiter } from './rate-limiting';

describe('MockRateLimiter', () => {
  it('allows requests up to the configured limit', async () => {
    const limiter = new MockRateLimiter(3, 60_000);

    const first = await limiter.consume('dev_1');
    const second = await limiter.consume('dev_1');
    const third = await limiter.consume('dev_1');

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('blocks a request once the limit is exceeded within the window', async () => {
    const limiter = new MockRateLimiter(2, 60_000);

    await limiter.consume('dev_1');
    await limiter.consume('dev_1');
    const third = await limiter.consume('dev_1');

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.limit).toBe(2);
  });

  it('tracks each subject independently', async () => {
    const limiter = new MockRateLimiter(1, 60_000);

    const devA = await limiter.consume('dev_a');
    const devB = await limiter.consume('dev_b');

    expect(devA.allowed).toBe(true);
    expect(devB.allowed).toBe(true);
  });

  it('resets the count once the window has elapsed', async () => {
    const limiter = new MockRateLimiter(1, 10);

    const first = await limiter.consume('dev_1');
    expect(first.allowed).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 20));

    const afterWindow = await limiter.consume('dev_1');
    expect(afterWindow.allowed).toBe(true);
  });
});
