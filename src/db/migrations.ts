import type { Migration } from './migrator';

export const migrations: readonly Migration[] = [
  {
    version: 1,
    description: 'create profile table',
    up: `
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];
