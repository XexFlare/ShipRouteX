/**
 * API Keys — issuing, looking up, and revoking the credentials developers
 * use to call ShipRoutesX. See docs/platform-architecture.md for how this
 * fits into the overall (not-yet-enabled) authentication flow.
 */

export interface ApiKey {
  id: string;
  /** The developer account this key belongs to. */
  developerId: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** False once revoked — a revoked key must never authenticate again. */
  active: boolean;
}

/** The result of issuing a new key: the record, plus the raw secret value. */
export interface CreatedApiKey {
  apiKey: ApiKey;
  /**
   * The raw secret value, shown only once at creation — a real
   * implementation stores a hash of this, not the value itself, so it can
   * never be recovered again after this call returns.
   */
  rawKey: string;
}

export interface ApiKeyService {
  /** Looks up an API key by its raw secret value. Undefined if not found. */
  findByKey(rawKey: string): Promise<ApiKey | undefined>;
  /** Issues a new, active API key for a developer account. */
  createKey(developerId: string): Promise<CreatedApiKey>;
  /** Revokes (deactivates) an API key. No-op if it doesn't exist. */
  revokeKey(keyId: string): Promise<void>;
}

/**
 * An in-memory `ApiKeyService`. Functionally correct for a single process —
 * `createKey`/`findByKey`/`revokeKey` behave as a real implementation would
 * — but keys are lost on restart, "raw keys" are plain random strings (not
 * hashed the way real secrets must be before storage), and nothing here is
 * shared across multiple API instances. A production implementation needs a
 * real datastore and proper secret hashing; this exists so the rest of the
 * platform has something real to call before that exists.
 */
export class MockApiKeyService implements ApiKeyService {
  private readonly keysById = new Map<string, ApiKey>();
  private readonly keyIdByRawKey = new Map<string, string>();

  async createKey(developerId: string): Promise<CreatedApiKey> {
    const id = `key_${Math.random().toString(36).slice(2, 10)}`;
    const rawKey = `srx_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

    const apiKey: ApiKey = {
      id,
      developerId,
      createdAt: new Date().toISOString(),
      active: true,
    };

    this.keysById.set(id, apiKey);
    this.keyIdByRawKey.set(rawKey, id);

    return Promise.resolve({ apiKey, rawKey });
  }

  async findByKey(rawKey: string): Promise<ApiKey | undefined> {
    const id = this.keyIdByRawKey.get(rawKey);
    return Promise.resolve(id ? this.keysById.get(id) : undefined);
  }

  async revokeKey(keyId: string): Promise<void> {
    const existing = this.keysById.get(keyId);
    if (existing) this.keysById.set(keyId, { ...existing, active: false });
    return Promise.resolve();
  }
}
