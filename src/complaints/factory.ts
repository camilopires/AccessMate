/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';
import type { ComplaintStore } from './complaint-store';

let cached: ComplaintStore | null = null;

export function getComplaintStore(): ComplaintStore {
  if (cached) return cached;
  if (Platform.OS === 'web') {
    const { LocalStorageComplaintStore } =
      require('./local-storage-complaint-store') as typeof import('./local-storage-complaint-store');
    cached = new LocalStorageComplaintStore(window.localStorage);
  } else {
    const { SqliteComplaintStore } =
      require('./sqlite-complaint-store') as typeof import('./sqlite-complaint-store');
    const { ExpoSqliteAdapter } =
      require('../db/sqlite-adapter') as typeof import('../db/sqlite-adapter');
    const { getDatabase } = require('../db') as typeof import('../db');
    cached = new SqliteComplaintStore(new ExpoSqliteAdapter(getDatabase()));
  }
  return cached;
}

export function resetComplaintStoreForTests(): void {
  cached = null;
}
