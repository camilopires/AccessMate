import { Platform } from 'react-native';
import type { SettingsStore } from './store';
import { LocalStorageSettingsStore } from './store';

let cached: SettingsStore | null = null;

class InMemoryStorage implements Storage {
  private map = new Map<string, string>();
  length = 0;
  clear(): void {
    this.map.clear();
  }
  getItem(k: string): string | null {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  key(): string | null {
    return null;
  }
}

export function getSettingsStore(): SettingsStore {
  if (cached) return cached;
  const storage: Storage =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.localStorage
      : new InMemoryStorage();
  cached = new LocalStorageSettingsStore(storage);
  return cached;
}

export function resetSettingsStoreForTests(): void {
  cached = null;
}
