import { describe, it, expect } from 'vitest';
import { Complaint, ComplaintStatus } from './complaint-schemas';

describe('Complaint schema', () => {
  it('accepts a fully populated draft complaint', () => {
    const parsed = Complaint.parse({
      id: 'c-1',
      incidentId: 'inc-1',
      templateId: 'missed-passenger-assist',
      status: 'draft',
      createdAtISO: '2026-05-23T10:00:00Z',
    });
    expect(parsed.status).toBe('draft');
  });

  it('rejects an unknown status', () => {
    expect(() =>
      Complaint.parse({
        id: 'c-2',
        incidentId: 'i-1',
        templateId: 't',
        status: 'enqueued',
        createdAtISO: '2026-05-23T10:00:00Z',
      }),
    ).toThrow();
  });

  it('exposes the allowed status enum', () => {
    expect(ComplaintStatus.options).toEqual([
      'draft',
      'sent',
      'acknowledged',
      'resolved',
      'escalated',
    ]);
  });
});
