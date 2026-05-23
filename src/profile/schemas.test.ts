import { describe, it, expect } from 'vitest';
import { Profile, BatterySpec, EmergencyContact } from './schemas';

describe('Profile schema', () => {
  it('accepts a minimal profile with no fields set', () => {
    const parsed = Profile.parse({});
    expect(parsed.mobility).toBeUndefined();
    expect(parsed.emergencyContacts).toEqual([]);
  });

  it('accepts a full mobility profile with IATA wheelchair battery fields', () => {
    const input = {
      mobility: {
        usesWheelchair: true,
        wheelchairType: 'powered',
        battery: {
          chemistry: 'lithium-ion',
          wattHours: 270,
          isDryCell: false,
          isSpillable: false,
        },
        weightKg: 130,
        widthCm: 62,
        heightCm: 92,
        lengthCm: 110,
        canTransfer: false,
      },
    };
    const parsed = Profile.parse(input);
    expect(parsed.mobility?.battery?.wattHours).toBe(270);
    expect(parsed.mobility?.wheelchairType).toBe('powered');
  });

  it('rejects an unknown wheelchair type', () => {
    expect(() => Profile.parse({ mobility: { wheelchairType: 'jetpack' } })).toThrow();
  });

  it('rejects negative battery watt-hours', () => {
    expect(() => BatterySpec.parse({ chemistry: 'lithium-ion', wattHours: -5 })).toThrow();
  });

  it('accepts sensory, comms, and medical sections', () => {
    const parsed = Profile.parse({
      sensory: { isBlind: false, isLowVision: true, isDeaf: false, isHardOfHearing: true },
      communication: { prefersBSL: false, prefersWriting: true, needsExtraTime: true },
      medical: {
        conditions: ['epilepsy'],
        medications: [{ name: 'Levetiracetam', notes: 'twice daily' }],
        carriesEpiPen: false,
      },
    });
    expect(parsed.sensory?.isHardOfHearing).toBe(true);
    expect(parsed.medical?.medications?.[0].name).toBe('Levetiracetam');
  });

  it('accepts emergency contacts and validates phone format', () => {
    const parsed = Profile.parse({
      emergencyContacts: [{ name: 'Jane', relationship: 'partner', phone: '+44-7700-900123' }],
    });
    expect(parsed.emergencyContacts).toHaveLength(1);
    expect(() => EmergencyContact.parse({ name: 'X', phone: 'not a phone' })).toThrow();
  });

  it('accepts a UK Blue Badge entry', () => {
    const parsed = Profile.parse({
      blueBadge: { holder: true, number: 'XYZ123', expiryISO: '2028-01-01' },
    });
    expect(parsed.blueBadge?.holder).toBe(true);
  });
});
