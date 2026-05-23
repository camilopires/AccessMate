/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';
import type { IncidentStore } from './store';

let cached: IncidentStore | null = null;

export function getIncidentStore(): IncidentStore {
  if (cached) return cached;
  if (Platform.OS === 'web') {
    const { LocalStorageIncidentStore } =
      require('./local-storage-store') as typeof import('./local-storage-store');
    cached = new LocalStorageIncidentStore(window.localStorage);
  } else {
    const { SqliteIncidentStore } = require('./sqlite-store') as typeof import('./sqlite-store');
    const { ExpoSqliteAdapter } =
      require('../db/sqlite-adapter') as typeof import('../db/sqlite-adapter');
    const { getDatabase } = require('../db') as typeof import('../db');
    cached = new SqliteIncidentStore(new ExpoSqliteAdapter(getDatabase()));
  }
  return cached;
}

export function resetIncidentStoreForTests(): void {
  cached = null;
}
