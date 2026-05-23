import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageSettingsStore } from './store';

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

describe('LocalStorageSettingsStore', () => {
  let store: LocalStorageSettingsStore;
  beforeEach(() => {
    store = new LocalStorageSettingsStore(new MemoryStorage() as unknown as Storage);
  });

  it('returns sane defaults when nothing is stored', () => {
    const s = store.get();
    expect(s.fontScale).toBe(1);
    expect(s.highContrast).toBe(false);
    expect(s.reduceMotion).toBe(false);
    expect(s.aiProvider).toBe('off');
  });

  it('round-trips partial updates and keeps unset defaults', () => {
    store.update({ fontScale: 1.4 });
    store.update({ highContrast: true });
    const s = store.get();
    expect(s.fontScale).toBe(1.4);
    expect(s.highContrast).toBe(true);
    expect(s.reduceMotion).toBe(false);
  });

  it('rejects out-of-range fontScale', () => {
    expect(() => store.update({ fontScale: 0.5 })).toThrow();
    expect(() => store.update({ fontScale: 5 })).toThrow();
  });

  it('treats unparseable storage as defaults', () => {
    const ms = new MemoryStorage();
    ms.setItem('accessmate.settings.v1', 'not-json');
    const fresh = new LocalStorageSettingsStore(ms as unknown as Storage);
    expect(fresh.get().fontScale).toBe(1);
  });
});
