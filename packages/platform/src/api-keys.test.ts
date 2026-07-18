import { describe, expect, it } from 'vitest';
import { MockApiKeyService } from './api-keys';

describe('MockApiKeyService', () => {
  it('creates a key that can then be found by its raw value', async () => {
    const service = new MockApiKeyService();
    const { apiKey, rawKey } = await service.createKey('dev_1');

    expect(apiKey.developerId).toBe('dev_1');
    expect(apiKey.active).toBe(true);

    const found = await service.findByKey(rawKey);
    expect(found).toEqual(apiKey);
  });

  it('returns undefined for an unknown raw key', async () => {
    const service = new MockApiKeyService();
    expect(await service.findByKey('does-not-exist')).toBeUndefined();
  });

  it('issues distinct ids and raw keys for successive keys', async () => {
    const service = new MockApiKeyService();
    const first = await service.createKey('dev_1');
    const second = await service.createKey('dev_1');

    expect(first.apiKey.id).not.toBe(second.apiKey.id);
    expect(first.rawKey).not.toBe(second.rawKey);
  });

  it('marks a revoked key inactive, and it stays findable (so callers can see it was revoked)', async () => {
    const service = new MockApiKeyService();
    const { apiKey, rawKey } = await service.createKey('dev_1');

    await service.revokeKey(apiKey.id);

    const found = await service.findByKey(rawKey);
    expect(found?.active).toBe(false);
  });

  it('revoking an unknown key id is a no-op, not an error', async () => {
    const service = new MockApiKeyService();
    await expect(service.revokeKey('does-not-exist')).resolves.toBeUndefined();
  });
});
