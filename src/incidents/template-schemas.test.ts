import { describe, it, expect } from 'vitest';
import { ComplaintTemplate } from './template-schemas';

describe('ComplaintTemplate schema', () => {
  it('accepts a fully populated template', () => {
    const parsed = ComplaintTemplate.parse({
      id: 'missed-passenger-assist',
      title: 'Missed Passenger Assist',
      mode: 'rail',
      emailSubject: 'Complaint: missed Passenger Assist on {{date}}',
      header:
        'I am writing to complain about missed Passenger Assist on a journey with {{operator}}.',
      legalParagraph:
        'Under the Equality Act 2010 and the ATP Code of Practice, operators must provide reliable assistance.',
      ask: 'I would like a full investigation and a written explanation within 20 working days.',
      regulator: 'orr',
    });
    expect(parsed.id).toBe('missed-passenger-assist');
  });

  it('rejects an empty id', () => {
    expect(() =>
      ComplaintTemplate.parse({
        id: '',
        title: 'x',
        mode: 'rail',
        emailSubject: 's',
        header: 'h',
        legalParagraph: 'l',
        ask: 'a',
        regulator: 'orr',
      }),
    ).toThrow();
  });

  it('rejects an unknown transport mode', () => {
    expect(() =>
      ComplaintTemplate.parse({
        id: 'x',
        title: 't',
        mode: 'spaceship',
        emailSubject: 's',
        header: 'h',
        legalParagraph: 'l',
        ask: 'a',
        regulator: 'orr',
      }),
    ).toThrow();
  });
});
