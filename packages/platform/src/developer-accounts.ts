/**
 * Developer Accounts — the top of the platform's data model: a developer
 * signs up, owns zero or more API keys (see `./api-keys.ts`), and has usage
 * (`./usage-tracking.ts`) attributed to their account. See
 * docs/platform-architecture.md for how account creation fits into the
 * planned signup flow.
 */

/** Mirrors the tiers shown on the ShipRoutesX pricing page (apps/web). */
export type DeveloperPlan = 'free' | 'pro' | 'enterprise';

export interface DeveloperAccount {
  id: string;
  email: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  plan: DeveloperPlan;
}

export interface CreateDeveloperAccountInput {
  email: string;
  /** Defaults to "free". */
  plan?: DeveloperPlan;
}

export interface DeveloperAccountService {
  findById(id: string): Promise<DeveloperAccount | undefined>;
  findByEmail(email: string): Promise<DeveloperAccount | undefined>;
  create(input: CreateDeveloperAccountInput): Promise<DeveloperAccount>;
}

/**
 * An in-memory `DeveloperAccountService`. Functionally real for a single
 * process (rejects duplicate emails, generates ids) but non-persistent —
 * a production implementation needs a real datastore, which this does not
 * attempt.
 */
export class MockDeveloperAccountService implements DeveloperAccountService {
  private readonly accountsById = new Map<string, DeveloperAccount>();

  async findById(id: string): Promise<DeveloperAccount | undefined> {
    return Promise.resolve(this.accountsById.get(id));
  }

  async findByEmail(email: string): Promise<DeveloperAccount | undefined> {
    return Promise.resolve(
      [...this.accountsById.values()].find((account) => account.email === email),
    );
  }

  async create(input: CreateDeveloperAccountInput): Promise<DeveloperAccount> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new Error(`A developer account already exists for ${input.email}`);
    }

    const account: DeveloperAccount = {
      id: `dev_${Math.random().toString(36).slice(2, 10)}`,
      email: input.email,
      createdAt: new Date().toISOString(),
      plan: input.plan ?? 'free',
    };

    this.accountsById.set(account.id, account);
    return account;
  }
}
