import { describe, it, expect } from 'vitest';
import { assembleDraft } from './assemble';
import { getComplaintTemplate } from './templates';
import type { Incident } from '../incidents/schemas';
import type { Profile } from '../profile/schemas';

const incident: Incident = {
  id: 'inc-1',
  status: 'completed',
  startedAtISO: '2026-05-23T10:30:00Z',
  completedAtISO: '2026-05-23T10:45:00Z',
  summary: 'Missed Passenger Assist at Euston',
  operatorId: 'avanti-west-coast',
  location: { lat: 51.528, lng: -0.1339, label: 'Euston' },
};

const profile: Profile = {
  emergencyContacts: [],
  mobility: { usesWheelchair: true, wheelchairType: 'powered' },
  sensory: { isHardOfHearing: true },
  communication: { needsExtraTime: true },
};

describe('assembleDraft', () => {
  it('produces a markdown draft with all five required sections', () => {
    const template = getComplaintTemplate('missed-passenger-assist')!;
    const draft = assembleDraft({
      incident,
      profile,
      template,
      operatorName: 'Avanti West Coast',
      mediaSummaries: ['Note: no ramp at vestibule'],
    });
    expect(draft).toMatch(/^# Missed Passenger Assist/m);
    expect(draft).toMatch(/^## What happened/m);
    expect(draft).toMatch(/^## About me/m);
    expect(draft).toMatch(/^## Legal context/m);
    expect(draft).toMatch(/^## What I want/m);
  });

  it('substitutes {{operator}}, {{date}}, {{location}} placeholders', () => {
    const template = getComplaintTemplate('missed-passenger-assist')!;
    const draft = assembleDraft({
      incident,
      profile,
      template,
      operatorName: 'Avanti West Coast',
    });
    expect(draft).toContain('Avanti West Coast');
    expect(draft).toContain('Euston');
    expect(draft).toMatch(/2026-05-23/);
    expect(draft).not.toMatch(/\{\{/);
  });

  it('renders profile facts that are relevant (powered wheelchair, hard of hearing, extra time)', () => {
    const template = getComplaintTemplate('missed-passenger-assist')!;
    const draft = assembleDraft({
      incident,
      profile,
      template,
      operatorName: 'Avanti West Coast',
    });
    expect(draft).toMatch(/Powered wheelchair/);
    expect(draft).toMatch(/Hard of hearing/);
    expect(draft).toMatch(/extra time/i);
  });

  it('includes the captured media summaries under What happened', () => {
    const template = getComplaintTemplate('missed-passenger-assist')!;
    const draft = assembleDraft({
      incident,
      profile,
      template,
      operatorName: 'Avanti West Coast',
      mediaSummaries: ['Note: no ramp at vestibule', 'Photo: damaged ramp'],
    });
    expect(draft).toMatch(/no ramp at vestibule/);
    expect(draft).toMatch(/damaged ramp/);
  });

  it('still produces a usable draft when the profile is empty', () => {
    const template = getComplaintTemplate('missed-passenger-assist')!;
    const draft = assembleDraft({
      incident,
      profile: { emergencyContacts: [] },
      template,
      operatorName: 'Avanti West Coast',
    });
    expect(draft).toContain('About me');
    expect(draft).toMatch(/no specific accessibility profile/i);
  });
});
