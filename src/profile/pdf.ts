import type { Profile } from './schemas';

function escape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function describeWheelchairType(t?: string): string | null {
  if (t === 'powered') return 'Powered wheelchair';
  if (t === 'manual') return 'Manual wheelchair';
  if (t === 'mobility-scooter') return 'Mobility scooter';
  return null;
}

function describeBattery(p: Profile): string | null {
  const b = p.mobility?.battery;
  if (!b) return null;
  const parts: string[] = [];
  if (b.chemistry === 'lithium-ion') parts.push('lithium-ion');
  else if (b.chemistry === 'lithium-iron-phosphate') parts.push('lithium iron phosphate (LiFePO4)');
  else if (b.chemistry === 'sealed-lead-acid') parts.push('sealed lead-acid');
  else if (b.chemistry === 'gel-cell') parts.push('gel cell');
  else if (b.chemistry === 'wet-cell') parts.push('wet cell');
  else if (b.chemistry === 'dry-cell') parts.push('dry cell');
  else if (b.chemistry) parts.push(b.chemistry);
  if (b.wattHours != null) parts.push(`${b.wattHours} Wh`);
  if (b.isDryCell) parts.push('dry cell');
  if (b.isSpillable) parts.push('spillable');
  return `Battery: ${parts.join(', ')}`;
}

function section(title: string, items: (string | null | false | undefined)[]): string {
  const lis = items.filter((x): x is string => !!x).map((t) => `<li>${escape(t)}</li>`);
  if (lis.length === 0) return '';
  return `<section><h2>${escape(title)}</h2><ul>${lis.join('')}</ul></section>`;
}

const STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18pt; color: #000; background: #fff; margin: 40px; line-height: 1.4; }
  h1 { font-size: 32pt; margin: 0 0 16px 0; }
  h2 { font-size: 22pt; margin: 24px 0 8px 0; }
  ul { padding-left: 20px; margin: 0 0 12px 0; }
  li { margin: 4px 0; }
  .empty { font-style: italic; }
`;

export function passportToHtml(p: Profile): string {
  const m = p.mobility;
  const s = p.sensory;
  const c = p.communication;
  const med = p.medical;
  const bb = p.blueBadge;

  const sections: string[] = [];
  if (m) {
    sections.push(
      section('Mobility', [
        describeWheelchairType(m.wheelchairType),
        describeBattery(p),
        m.weightKg != null ? `Weight (with chair): ${m.weightKg} kg` : null,
        m.canTransfer === true ? 'Can transfer from chair' : null,
        m.canTransfer === false ? 'Cannot transfer from chair' : null,
      ]),
    );
  }
  if (s) {
    sections.push(
      section('Sensory', [
        s.isBlind && 'Blind',
        s.isLowVision && 'Low vision',
        s.isDeaf && 'Deaf',
        s.isHardOfHearing && 'Hard of hearing',
        s.hasGuideDog && 'Travelling with a guide dog',
        s.hasAssistanceDog && 'Travelling with an assistance dog',
      ]),
    );
  }
  if (c) {
    sections.push(
      section('Communication', [
        c.prefersBSL && 'Prefers British Sign Language',
        c.prefersWriting && 'Prefers written communication',
        c.prefersSpeech && 'Prefers spoken communication',
        c.needsExtraTime && 'Needs extra time when speaking or reading',
        c.notes ?? null,
      ]),
    );
  }
  if (med) {
    sections.push(
      section('Medical', [
        med.carriesEpiPen && 'Carries EpiPen',
        med.conditions && med.conditions.length > 0
          ? `Conditions: ${med.conditions.join(', ')}`
          : null,
        med.allergies && med.allergies.length > 0 ? `Allergies: ${med.allergies.join(', ')}` : null,
        med.medications && med.medications.length > 0
          ? `Medications: ${med.medications.map((x) => x.name).join(', ')}`
          : null,
        med.notes ?? null,
      ]),
    );
  }
  if (bb) {
    sections.push(
      section('Blue Badge', [
        bb.holder ? 'UK Blue Badge holder' : 'Not a Blue Badge holder',
        bb.number ? `Badge number: ${bb.number}` : null,
        bb.expiryISO ? `Expires: ${bb.expiryISO}` : null,
      ]),
    );
  }
  if (p.emergencyContacts && p.emergencyContacts.length > 0) {
    sections.push(
      section(
        'Emergency contacts',
        p.emergencyContacts.map(
          (ec) => `${ec.name}${ec.relationship ? ` (${ec.relationship})` : ''} — ${ec.phone}`,
        ),
      ),
    );
  }
  if (p.notes) {
    sections.push(section('Notes', [p.notes]));
  }

  const body =
    sections.length > 0
      ? sections.join('')
      : `<p class="empty">${escape('Your passport is empty. Add details to share with staff.')}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Accessibility passport</title>
    <style>${STYLE}</style>
  </head>
  <body>
    <h1>Accessibility passport</h1>
    ${body}
  </body>
</html>`;
}

export async function exportPassportPdf(profile: Profile): Promise<void> {
  const html = passportToHtml(profile);
  // Dynamic import so the unit test of passportToHtml does not need to load
  // the native expo-print module under vitest.
  const Print = await import('expo-print');
  await Print.printAsync({ html });
}
