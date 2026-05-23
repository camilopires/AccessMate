export interface SqliteAdapter {
  execSync(sql: string): void;
  runSync(sql: string, params?: unknown[]): void;
  getFirstSync<T = unknown>(sql: string, params?: unknown[]): T | null;
}

export interface Migration {
  version: number;
  description: string;
  up: string;
}

const CREATE_SCHEMA_VERSION = `
  CREATE TABLE IF NOT EXISTS schema_version (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    version INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export class Migrator {
  constructor(
    private readonly db: SqliteAdapter,
    private readonly migrations: readonly Migration[],
  ) {
    for (let i = 1; i < migrations.length; i++) {
      if (migrations[i].version <= migrations[i - 1].version) {
        throw new Error(
          `Migrations must be in ascending version order; got ${migrations[i - 1].version} then ${migrations[i].version}`,
        );
      }
    }
  }

  currentVersion(): number {
    this.db.execSync(CREATE_SCHEMA_VERSION);
    const row = this.db.getFirstSync<{ version: number }>(
      `SELECT version FROM schema_version WHERE id = 1`,
    );
    return row?.version ?? 0;
  }

  migrate(): number {
    const current = this.currentVersion();
    const pending = this.migrations.filter((m) => m.version > current);
    for (const m of pending) {
      this.db.execSync(m.up);
      this.db.runSync(
        `INSERT OR REPLACE INTO schema_version (id, version, updated_at) VALUES (1, ?, datetime('now'))`,
        [m.version],
      );
    }
    return pending.length > 0 ? pending[pending.length - 1].version : current;
  }
}
