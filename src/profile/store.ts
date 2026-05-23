/* eslint-disable @typescript-eslint/no-require-imports */
// Uses require() so the native-only expo-sqlite path is never loaded on web
// (its web build needs SharedArrayBuffer / COOP+COEP, which the dev server
// does not set). Static imports would force-load every branch.
import { Platform } from 'react-native';
import type { Profile } from './schemas';

export interface ProfileStore {
  get(): Profile | null;
  upsert(profile: Profile): void;
}

let cached: ProfileStore | null = null;

export function getProfileStore(): ProfileStore {
  if (cached) return cached;
  if (Platform.OS === 'web') {
    // expo-sqlite's web build needs SharedArrayBuffer (COOP/COEP headers);
    // the dev server doesn't set those, so on web we persist to localStorage.
    const { LocalStorageProfileStore } =
      require('./local-storage-store') as typeof import('./local-storage-store');
    cached = new LocalStorageProfileStore(window.localStorage);
  } else {
    const { ProfileRepository } = require('./repository') as typeof import('./repository');
    const { ExpoSqliteAdapter } =
      require('../db/sqlite-adapter') as typeof import('../db/sqlite-adapter');
    const { getDatabase } = require('../db') as typeof import('../db');
    cached = new ProfileRepository(new ExpoSqliteAdapter(getDatabase()));
  }
  return cached;
}

export function resetProfileStoreForTests(): void {
  cached = null;
}
