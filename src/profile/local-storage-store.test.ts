import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageProfileStore } from './local-storage-store';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

describe('LocalStorageProfileStore', () => {
  let storage: MemoryStorage;
  let store: LocalStorageProfileStore;

  beforeEach(() => {
    storage = new MemoryStorage();
    store = new LocalStorageProfileStore(storage as unknown as Storage);
  });

  it('returns null when no profile has been saved', () => {
    expect(store.get()).toBeNull();
  });

  it('round-trips a profile through localStorage', () => {
    store.upsert({
      emergencyContacts: [],
      sensory: { isHardOfHearing: true },
    });
    expect(store.get()?.sensory?.isHardOfHearing).toBe(true);
  });

  it('upserting twice keeps the latest value', () => {
    store.upsert({ emergencyContacts: [], notes: 'first' });
    store.upsert({ emergencyContacts: [], notes: 'second' });
    expect(store.get()?.notes).toBe('second');
  });

  it('treats unparseable storage data as no profile', () => {
    storage.data.set('accessmate.profile.v1', 'not-json');
    expect(store.get()).toBeNull();
  });
});
