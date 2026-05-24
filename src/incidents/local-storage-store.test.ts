import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageIncidentStore } from './local-storage-store';

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
  let clock = Date.parse('2026-05-23T10:00:00.000Z');
  const store = new LocalStorageIncidentStore(storage as unknown as Storage, {
    newId: () => `id-${++counter}`,
    now: () => {
      clock += 1000;
      return new Date(clock).toISOString();
    },
  });
  return { store, storage };
}

describe('LocalStorageIncidentStore', () => {
  let store: LocalStorageIncidentStore;
  beforeEach(() => {
    store = makeStore().store;
  });

  it('starts a new in-progress incident with a generated id and timestamp', () => {
    const inc = store.start({});
    expect(inc.id).toBe('id-1');
    expect(inc.status).toBe('in_progress');
    expect(inc.startedAtISO).toMatch(/^2026-05-23T/);
  });

  it('lists in-progress incidents', () => {
    const a = store.start({});
    const b = store.start({ operatorId: 'avanti-west-coast' });
    const list = store.listInProgress();
    expect(list.map((i) => i.id).sort()).toEqual([a.id, b.id].sort());
  });

  it('marks an incident complete with optional summary', () => {
    const inc = store.start({});
    store.markComplete(inc.id, 'denied boarding');
    const got = store.get(inc.id);
    expect(got?.status).toBe('completed');
    expect(got?.summary).toBe('denied boarding');
    expect(got?.completedAtISO).toBeTruthy();
    expect(store.listInProgress()).toHaveLength(0);
  });

  it('attaches a text note to an incident', () => {
    const inc = store.start({});
    const note = store.attachMedia(inc.id, { kind: 'note', textBody: 'no ramp' });
    expect(note.id).toBeTruthy();
    const media = store.mediaFor(inc.id);
    expect(media).toHaveLength(1);
    expect(media[0].textBody).toBe('no ramp');
  });

  it('attaches a photo and audio with file URIs', () => {
    const inc = store.start({});
    store.attachMedia(inc.id, { kind: 'photo', fileUri: 'file:///p.jpg' });
    store.attachMedia(inc.id, { kind: 'audio', fileUri: 'file:///a.m4a' });
    expect(store.mediaFor(inc.id)).toHaveLength(2);
  });

  it('rejects an unknown incident id when attaching media', () => {
    expect(() => store.attachMedia('does-not-exist', { kind: 'note', textBody: 'x' })).toThrow();
  });

  it('discards an incident', () => {
    const inc = store.start({});
    store.discard(inc.id);
    expect(store.get(inc.id)?.status).toBe('discarded');
    expect(store.listInProgress()).toHaveLength(0);
  });
});

describe('LocalStorageIncidentStore — v0.2 lifecycle', () => {
  let store: LocalStorageIncidentStore;
  beforeEach(() => {
    store = makeStore().store;
  });

  it('saveDraft persists a draft incident with facts and draftBody', () => {
    const draft = store.saveDraft({
      title: 'Missed assist',
      facts: { mode: 'rail', operatorName: 'Avanti', scenarioId: 'missed-passenger-assist' },
      templateId: 'missed-passenger-assist',
      draftBody: '# Draft body',
      recipient: 'complaints@avanti.com',
    });
    expect(draft.status).toBe('draft');
    expect(store.get(draft.id)?.title).toBe('Missed assist');
    expect(store.get(draft.id)?.draftBody).toContain('Draft body');
    expect(store.listByStatus('draft')).toHaveLength(1);
  });

  it('markSent transitions draft → in_progress and stamps sentAtISO', () => {
    const draft = store.saveDraft({});
    store.markSent(draft.id);
    const after = store.get(draft.id)!;
    expect(after.status).toBe('in_progress');
    expect(after.sentAtISO).toBeTruthy();
    expect(store.listByStatus('in_progress')).toHaveLength(1);
  });

  it('appendEvent records an operator_response sub-event', () => {
    const draft = store.saveDraft({});
    store.markSent(draft.id);
    store.appendEvent(draft.id, {
      kind: 'operator_response',
      atISO: '2026-06-01T10:00:00Z',
      bodyMarkdown: 'We regret...',
    });
    expect(store.get(draft.id)?.events).toHaveLength(1);
  });

  it('markCompleted transitions to completed, stamps resolvedAtISO, and appends a marked_resolved event', () => {
    const draft = store.saveDraft({});
    store.markSent(draft.id);
    store.markCompleted(draft.id);
    const after = store.get(draft.id)!;
    expect(after.status).toBe('completed');
    expect(after.resolvedAtISO).toBeTruthy();
    expect(after.events.find((e) => e.kind === 'marked_resolved')).toBeTruthy();
  });

  it('listByStatus filters cleanly across the lifecycle', () => {
    const a = store.saveDraft({ title: 'A' });
    const b = store.saveDraft({ title: 'B' });
    store.saveDraft({ title: 'C' });
    store.markSent(a.id);
    store.markSent(b.id);
    store.markCompleted(b.id);
    expect(store.listByStatus('draft').map((i) => i.title)).toEqual(['C']);
    expect(store.listByStatus('in_progress').map((i) => i.title)).toEqual(['A']);
    expect(store.listByStatus('completed').map((i) => i.title)).toEqual(['B']);
  });
});
