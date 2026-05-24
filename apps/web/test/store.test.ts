import { describe, test, expect, beforeEach } from 'bun:test';

// happy-dom is registered in bunfig.toml's preload so localStorage is
// available before this module is imported.
const { listIncidents, saveIncident, getIncident, updateIncident, newIncidentId } = await import(
  '../src/store'
);

describe('store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('listIncidents starts empty', () => {
    expect(listIncidents()).toEqual([]);
  });

  test('saveIncident then listIncidents returns the saved incident', () => {
    saveIncident({
      id: 'i1',
      status: 'draft',
      startedAtISO: '2026-05-24T00:00:00Z',
      title: 'Test',
    });
    expect(listIncidents()).toHaveLength(1);
    expect(listIncidents()[0].id).toBe('i1');
  });

  test('saveIncident on an existing id replaces in place (no duplicate)', () => {
    saveIncident({ id: 'i1', status: 'draft', startedAtISO: '2026-05-24T00:00:00Z' });
    saveIncident({ id: 'i1', status: 'in_progress', startedAtISO: '2026-05-24T00:00:00Z' });
    const all = listIncidents();
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe('in_progress');
  });

  test('updateIncident merges a partial patch', () => {
    saveIncident({ id: 'i1', status: 'draft', startedAtISO: '2026-05-24T00:00:00Z' });
    const updated = updateIncident('i1', { status: 'completed', title: 'Done' });
    expect(updated?.status).toBe('completed');
    expect(updated?.title).toBe('Done');
    expect(getIncident('i1')?.status).toBe('completed');
  });

  test('newIncidentId returns a unique-looking string', () => {
    const a = newIncidentId();
    const b = newIncidentId();
    expect(a).not.toBe(b);
    expect(a.startsWith('inc-')).toBe(true);
  });
});
