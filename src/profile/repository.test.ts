import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileRepository } from './repository';
import type { SqliteAdapter } from '../db/migrator';
import type { Profile } from './schemas';

class InMemoryAdapter implements SqliteAdapter {
  rows = new Map<number, { id: number; data: string; updated_at: string }>();

  execSync(): void {}

  runSync(sql: string, params: unknown[] = []): void {
    if (/INSERT\s+OR\s+REPLACE\s+INTO\s+profile/i.test(sql)) {
      const [data] = params as [string];
      this.rows.set(1, { id: 1, data, updated_at: new Date().toISOString() });
    }
  }

  getFirstSync<T = unknown>(sql: string): T | null {
    if (/FROM\s+profile/i.test(sql)) {
      const row = this.rows.get(1);
      return (row as T) ?? null;
    }
    return null;
  }

  getAllSync<T = unknown>(): T[] {
    return [];
  }
}

describe('ProfileRepository', () => {
  let adapter: InMemoryAdapter;
  let repo: ProfileRepository;

  beforeEach(() => {
    adapter = new InMemoryAdapter();
    repo = new ProfileRepository(adapter);
  });

  it('returns null when no profile has been saved', () => {
    expect(repo.get()).toBeNull();
  });

  it('round-trips an upserted profile', () => {
    const input: Profile = {
      mobility: { usesWheelchair: true, wheelchairType: 'powered' },
      emergencyContacts: [{ name: 'Jane', phone: '+44-7700-900123' }],
    } as Profile;
    repo.upsert(input);
    const got = repo.get();
    expect(got?.mobility?.wheelchairType).toBe('powered');
    expect(got?.emergencyContacts?.[0].name).toBe('Jane');
  });

  it('upserting twice keeps the latest value', () => {
    repo.upsert({ notes: 'first' } as Profile);
    repo.upsert({ notes: 'second' } as Profile);
    expect(repo.get()?.notes).toBe('second');
  });

  it('throws when the stored row fails schema validation', () => {
    adapter.rows.set(1, {
      id: 1,
      data: '{"mobility":{"wheelchairType":"jetpack"}}',
      updated_at: 'x',
    });
    expect(() => repo.get()).toThrow();
  });
});
