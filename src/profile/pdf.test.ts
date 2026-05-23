import { describe, it, expect } from 'vitest';
import { passportToHtml } from './pdf';
import type { Profile } from './schemas';

const filled: Profile = {
  emergencyContacts: [{ name: 'Jane Doe', phone: '+44-7700-900123', relationship: 'partner' }],
  mobility: {
    usesWheelchair: true,
    wheelchairType: 'powered',
    battery: { chemistry: 'lithium-ion', wattHours: 270 },
  },
  sensory: { isHardOfHearing: true },
  medical: { carriesEpiPen: true, allergies: ['penicillin'] },
  blueBadge: { holder: true, number: 'XYZ123' },
};

describe('passportToHtml', () => {
  it('renders an HTML document with the right title', () => {
    const html = passportToHtml({ emergencyContacts: [] });
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toMatch(/<title>Accessibility passport<\/title>/i);
  });

  it('embeds the filled-in facts', () => {
    const html = passportToHtml(filled);
    expect(html).toMatch(/Powered wheelchair/);
    expect(html).toMatch(/270/);
    expect(html).toMatch(/lithium-ion/);
    expect(html).toMatch(/Hard of hearing/);
    expect(html).toMatch(/EpiPen/);
    expect(html).toMatch(/penicillin/);
    expect(html).toMatch(/UK Blue Badge holder/);
    expect(html).toMatch(/Jane Doe/);
    expect(html).toMatch(/\+44-7700-900123/);
  });

  it('escapes HTML in user-entered notes', () => {
    const html = passportToHtml({
      emergencyContacts: [],
      notes: '<script>alert("x")</script>',
    });
    expect(html).not.toMatch(/<script>alert/);
    expect(html).toMatch(/&lt;script&gt;alert/);
  });

  it('uses an accessible base font size (>=16pt body)', () => {
    const html = passportToHtml({ emergencyContacts: [] });
    expect(html).toMatch(/body\s*\{[^}]*font-size:\s*1[6-9]pt/i);
  });
});
