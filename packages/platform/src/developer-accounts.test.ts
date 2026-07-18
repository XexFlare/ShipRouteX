import { describe, expect, it } from 'vitest';
import { MockDeveloperAccountService } from './developer-accounts';

describe('MockDeveloperAccountService', () => {
  it('creates an account defaulting to the free plan', async () => {
    const service = new MockDeveloperAccountService();
    const account = await service.create({ email: 'dev@example.com' });

    expect(account.email).toBe('dev@example.com');
    expect(account.plan).toBe('free');
    expect(account.id).toBeDefined();
  });

  it('creates an account with an explicit plan', async () => {
    const service = new MockDeveloperAccountService();
    const account = await service.create({ email: 'dev@example.com', plan: 'pro' });

    expect(account.plan).toBe('pro');
  });

  it('finds a created account by id and by email', async () => {
    const service = new MockDeveloperAccountService();
    const created = await service.create({ email: 'dev@example.com' });

    expect(await service.findById(created.id)).toEqual(created);
    expect(await service.findByEmail('dev@example.com')).toEqual(created);
  });

  it('returns undefined for an account that does not exist', async () => {
    const service = new MockDeveloperAccountService();
    expect(await service.findById('missing')).toBeUndefined();
    expect(await service.findByEmail('missing@example.com')).toBeUndefined();
  });

  it('rejects creating a second account with the same email', async () => {
    const service = new MockDeveloperAccountService();
    await service.create({ email: 'dev@example.com' });

    await expect(service.create({ email: 'dev@example.com' })).rejects.toThrow(/already exists/);
  });
});
