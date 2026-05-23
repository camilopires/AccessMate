import type { SQLiteDatabase } from 'expo-sqlite';
import type { SqliteAdapter } from './migrator';

export class ExpoSqliteAdapter implements SqliteAdapter {
  constructor(private readonly db: SQLiteDatabase) {}

  execSync(sql: string): void {
    this.db.execSync(sql);
  }

  runSync(sql: string, params: unknown[] = []): void {
    this.db.runSync(sql, ...(params as never[]));
  }

  getFirstSync<T = unknown>(sql: string, params: unknown[] = []): T | null {
    return this.db.getFirstSync<T>(sql, ...(params as never[]));
  }
}
