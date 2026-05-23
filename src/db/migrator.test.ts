import { describe, it, expect, beforeEach } from 'vitest';
import { Migrator, type SqliteAdapter, type Migration } from './migrator';

class FakeAdapter implements SqliteAdapter {
  statements: { sql: string; params: unknown[] }[] = [];
  version = 0;
  versionExists = true;

  execSync(sql: string): void {
    this.statements.push({ sql, params: [] });
  }
  runSync(sql: string, params: unknown[] = []): void {
    this.statements.push({ sql, params });
    if (/INSERT.+OR REPLACE.+schema_version/i.test(sql)) {
      this.version = params[0] as number;
    }
  }
  getFirstSync<T>(sql: string): T | null {
    if (/FROM\s+schema_version/i.test(sql)) {
      return this.versionExists ? ({ version: this.version } as T) : null;
    }
    return null;
  }
  getAllSync<T>(): T[] {
    return [];
  }
}

const m1: Migration = {
  version: 1,
  description: 'create profile table',
  up: `CREATE TABLE profile (id INTEGER PRIMARY KEY, data TEXT NOT NULL);`,
};
const m2: Migration = {
  version: 2,
  description: 'add updated_at',
  up: `ALTER TABLE profile ADD COLUMN updated_at TEXT;`,
};

describe('Migrator', () => {
  let adapter: FakeAdapter;
  beforeEach(() => {
    adapter = new FakeAdapter();
  });

  it('creates the schema_version table on first run', () => {
    adapter.versionExists = false;
    const mig = new Migrator(adapter, []);
    mig.migrate();
    expect(adapter.statements.some((s) => /CREATE TABLE.+schema_version/i.test(s.sql))).toBe(true);
  });

  it('applies all migrations from version 0', () => {
    adapter.versionExists = false;
    const mig = new Migrator(adapter, [m1, m2]);
    mig.migrate();
    const ups = adapter.statements.filter((s) =>
      /CREATE TABLE profile|ALTER TABLE profile/.test(s.sql),
    );
    expect(ups).toHaveLength(2);
    expect(adapter.version).toBe(2);
  });

  it('skips already-applied migrations', () => {
    adapter.version = 1;
    const mig = new Migrator(adapter, [m1, m2]);
    mig.migrate();
    const ups = adapter.statements.filter((s) =>
      /CREATE TABLE profile|ALTER TABLE profile/.test(s.sql),
    );
    expect(ups).toHaveLength(1);
    expect(ups[0].sql).toMatch(/ALTER TABLE profile/);
    expect(adapter.version).toBe(2);
  });

  it('is a no-op when already at the latest version', () => {
    adapter.version = 2;
    const mig = new Migrator(adapter, [m1, m2]);
    mig.migrate();
    const ups = adapter.statements.filter((s) =>
      /CREATE TABLE profile|ALTER TABLE profile/.test(s.sql),
    );
    expect(ups).toHaveLength(0);
  });

  it('rejects out-of-order migration versions', () => {
    expect(() => new Migrator(adapter, [m2, m1])).toThrow(/order/i);
  });
});
