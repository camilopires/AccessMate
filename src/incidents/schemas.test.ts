import { describe, it, expect } from 'vitest';
import { Incident, MediaRef, IncidentStatus, MediaKind, IncidentEvent } from './schemas';

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

describe('Incident schema (v0.2 merged fields)', () => {
  it('accepts the merged complaint fields + draft status', () => {
    const parsed = Incident.parse({
      id: 'inc-x',
      status: 'draft',
      startedAtISO: '2026-05-23T10:00:00Z',
      title: 'Missed assist at Euston',
      facts: {
        whenISO: '2026-05-23T10:00:00Z',
        mode: 'rail',
        operatorName: 'Avanti West Coast',
        scenarioId: 'missed-passenger-assist',
        narrative: 'No ramp at the door.',
        accompanied: false,
        waitedMinutes: 25,
      },
      templateId: 'missed-passenger-assist',
      draftBody: '# Missed Passenger Assist\n\nDear...',
      recipient: 'customer.resolutions@avantiwestcoast.co.uk',
      events: [],
    });
    expect(parsed.title).toBe('Missed assist at Euston');
    expect(parsed.facts?.waitedMinutes).toBe(25);
    expect(parsed.status).toBe('draft');
  });

  it('defaults events to []', () => {
    const parsed = Incident.parse({
      id: 'inc-y',
      status: 'draft',
      startedAtISO: '2026-05-23T10:00:00Z',
    });
    expect(parsed.events).toEqual([]);
  });
});

describe('IncidentEvent schema', () => {
  it('accepts an escalated_to_regulator event', () => {
    const parsed = IncidentEvent.parse({
      kind: 'escalated_to_regulator',
      atISO: '2026-07-23T10:00:00Z',
      regulator: 'orr',
      draftBody: 'To the ORR...',
    });
    expect(parsed.kind).toBe('escalated_to_regulator');
  });

  it('accepts an operator_response event', () => {
    const parsed = IncidentEvent.parse({
      kind: 'operator_response',
      atISO: '2026-06-23T10:00:00Z',
      bodyMarkdown: 'We regret...',
    });
    expect(parsed.kind).toBe('operator_response');
  });

  it('rejects an unknown event kind', () => {
    expect(() => IncidentEvent.parse({ kind: 'magic', atISO: '2026-06-23T10:00:00Z' })).toThrow();
  });
});
