import * as SQLite from 'expo-sqlite';
import { Migrator } from './migrator';
import { migrations } from './migrations';
import { ExpoSqliteAdapter } from './sqlite-adapter';

const DB_NAME = 'accessmate.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let migrated = false;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  if (!migrated) {
    const migrator = new Migrator(new ExpoSqliteAdapter(dbInstance), migrations);
    migrator.migrate();
    migrated = true;
  }
  return dbInstance;
}

export function resetDatabaseForTests(): void {
  dbInstance = null;
  migrated = false;
}
