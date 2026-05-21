import { describe, it, expect } from 'vitest';
import { OperatorEntry } from './schemas';

describe('OperatorEntry schema', () => {
  it('accepts a valid rail operator', () => {
    const sample = {
      id: 'avanti-west-coast',
      name: 'Avanti West Coast',
      mode: 'rail',
      assistance: {
        phone: '+44-3457-225225',
        bookingUrl: 'https://www.avantiwestcoast.co.uk/travelling-with-us/accessibility',
      },
      complaintsRoute: {
        primaryEmail: 'customer.resolutions@avantiwestcoast.co.uk',
        regulator: 'orr',
      },
      lastVerifiedUTC: '2026-05-21T00:00:00Z',
    };
    expect(() => OperatorEntry.parse(sample)).not.toThrow();
  });

  it('rejects an unknown mode', () => {
    const bad = {
      id: 'x',
      name: 'X',
      mode: 'teleport',
      assistance: { phone: '+44-1' },
      complaintsRoute: { primaryEmail: 'a@b.c', regulator: 'orr' },
      lastVerifiedUTC: '2026-05-21T00:00:00Z',
    };
    expect(() => OperatorEntry.parse(bad)).toThrow();
  });
});
