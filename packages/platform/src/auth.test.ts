import { describe, expect, it } from 'vitest';
import { MockAuthenticator } from './auth';

describe('MockAuthenticator', () => {
  it('authenticates a request with an API key', async () => {
    const authenticator = new MockAuthenticator();
    const context = await authenticator.authenticate('any-key-value');

    expect(context.authenticated).toBe(true);
    expect(context.developerId).toBeDefined();
  });

  it('also authenticates a request with no API key at all (real auth is not implemented yet)', async () => {
    const authenticator = new MockAuthenticator();
    const context = await authenticator.authenticate(undefined);

    expect(context.authenticated).toBe(true);
  });
});
