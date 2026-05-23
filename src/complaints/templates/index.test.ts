import { describe, it, expect } from 'vitest';
import { loadComplaintTemplates } from './index';

describe('loadComplaintTemplates', () => {
  it('returns all 10 v1 templates, every one schema-valid', () => {
    const templates = loadComplaintTemplates();
    expect(templates).toHaveLength(10);
  });

  it('includes the canonical scenarios named in the plan', () => {
    const ids = loadComplaintTemplates().map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'missed-passenger-assist',
        'damaged-mobility-equipment',
        'refused-boarding-rail',
        'refused-boarding-air',
        'inaccessible-facility',
        'discriminatory-treatment',
        'no-audio-announcements',
        'bsl-communication-failure',
        'taxi-refusal',
        'tfl-specific',
      ]),
    );
  });

  it('every template has a non-empty header, legalParagraph, and ask', () => {
    for (const t of loadComplaintTemplates()) {
      expect(t.header.length).toBeGreaterThan(20);
      expect(t.legalParagraph.length).toBeGreaterThan(20);
      expect(t.ask.length).toBeGreaterThan(20);
    }
  });
});
