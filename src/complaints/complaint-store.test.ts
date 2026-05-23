import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageComplaintStore } from './local-storage-complaint-store';

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

function makeStore() {
  const storage = new MemoryStorage();
  let counter = 0;
  let clock = Date.parse('2026-05-23T10:00:00Z');
  const store = new LocalStorageComplaintStore(storage as unknown as Storage, {
    newId: () => `id-${++counter}`,
    now: () => {
      clock += 1000;
      return new Date(clock).toISOString();
    },
  });
  return store;
}

describe('LocalStorageComplaintStore', () => {
  let store: LocalStorageComplaintStore;
  beforeEach(() => {
    store = makeStore();
  });

  it('creates a draft complaint', () => {
    const c = store.create({ incidentId: 'inc-1', templateId: 'missed-passenger-assist' });
    expect(c.status).toBe('draft');
    expect(c.id).toBe('id-1');
    expect(store.get(c.id)).not.toBeNull();
  });

  it('marks sent / acknowledged / resolved with timestamps', () => {
    const c = store.create({ incidentId: 'inc-1', templateId: 't' });
    store.markSent(c.id);
    store.markAcknowledged(c.id);
    store.markResolved(c.id);
    const got = store.get(c.id)!;
    expect(got.status).toBe('resolved');
    expect(got.sentAtISO).toBeTruthy();
    expect(got.acknowledgedAtISO).toBeTruthy();
    expect(got.resolvedAtISO).toBeTruthy();
  });

  it('escalating overrides resolved-bound transitions', () => {
    const c = store.create({ incidentId: 'inc-1', templateId: 't' });
    store.markSent(c.id);
    store.markEscalated(c.id);
    const got = store.get(c.id)!;
    expect(got.status).toBe('escalated');
    expect(got.escalatedAtISO).toBeTruthy();
  });

  it('lists all and lists per incident', () => {
    store.create({ incidentId: 'inc-1', templateId: 't' });
    store.create({ incidentId: 'inc-2', templateId: 't' });
    expect(store.listAll()).toHaveLength(2);
    expect(store.listForIncident('inc-1')).toHaveLength(1);
  });

  it('setResponse stores a paste-back', () => {
    const c = store.create({ incidentId: 'inc-1', templateId: 't' });
    store.setResponse(c.id, 'Thanks, we will investigate.');
    expect(store.get(c.id)?.responseMarkdown).toContain('investigate');
  });
});
