import { describe, it, expect } from 'vitest';
import { Incident, MediaRef, IncidentStatus, MediaKind } from './schemas';

describe('Incident schema', () => {
  it('accepts a minimal in-progress incident', () => {
    const parsed = Incident.parse({
      id: 'inc-1',
      status: 'in_progress',
      startedAtISO: '2026-05-23T10:00:00Z',
    });
    expect(parsed.status).toBe('in_progress');
  });

  it('rejects an unknown status', () => {
    expect(() =>
      Incident.parse({ id: 'x', status: 'bogus', startedAtISO: '2026-05-23T10:00:00Z' }),
    ).toThrow();
  });

  it('accepts optional location + operator + summary', () => {
    const parsed = Incident.parse({
      id: 'inc-2',
      status: 'completed',
      startedAtISO: '2026-05-23T10:00:00Z',
      completedAtISO: '2026-05-23T10:05:00Z',
      summary: 'Missed passenger assist at Euston',
      operatorId: 'avanti-west-coast',
      location: { lat: 51.528, lng: -0.1339, label: 'Euston' },
    });
    expect(parsed.summary).toBe('Missed passenger assist at Euston');
    expect(parsed.location?.label).toBe('Euston');
  });

  it('exposes the allowed status and media kind enums', () => {
    expect(IncidentStatus.options).toContain('in_progress');
    expect(IncidentStatus.options).toContain('completed');
    expect(MediaKind.options).toEqual(['photo', 'audio', 'note']);
  });
});

describe('MediaRef schema', () => {
  it('accepts a photo with a file uri', () => {
    const parsed = MediaRef.parse({
      id: 'm-1',
      incidentId: 'inc-1',
      kind: 'photo',
      fileUri: 'file:///tmp/x.jpg',
      capturedAtISO: '2026-05-23T10:01:00Z',
    });
    expect(parsed.kind).toBe('photo');
  });

  it('accepts a note with text body and no file', () => {
    const parsed = MediaRef.parse({
      id: 'm-2',
      incidentId: 'inc-1',
      kind: 'note',
      textBody: 'no ramp at vestibule',
      capturedAtISO: '2026-05-23T10:01:00Z',
    });
    expect(parsed.textBody).toBe('no ramp at vestibule');
  });

  it('rejects a non-note without a fileUri', () => {
    expect(() =>
      MediaRef.parse({
        id: 'm-3',
        incidentId: 'inc-1',
        kind: 'photo',
        capturedAtISO: '2026-05-23T10:01:00Z',
      }),
    ).toThrow();
  });

  it('rejects a note without a textBody', () => {
    expect(() =>
      MediaRef.parse({
        id: 'm-4',
        incidentId: 'inc-1',
        kind: 'note',
        capturedAtISO: '2026-05-23T10:01:00Z',
      }),
    ).toThrow();
  });
});
