import type { Incident } from './schemas';
import type { Profile } from '../profile/schemas';
import type { ComplaintTemplate } from './template-schemas';

export interface AssembleInput {
  incident: Incident;
  profile: Profile;
  template: ComplaintTemplate;
  operatorName?: string;
  mediaSummaries?: string[];
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function fillPlaceholders(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] ?? '');
}

function profileFacts(p: Profile): string[] {
  const out: string[] = [];
  const m = p.mobility;
  if (m?.wheelchairType === 'powered') out.push('- Powered wheelchair user.');
  if (m?.wheelchairType === 'manual') out.push('- Manual wheelchair user.');
  if (m?.wheelchairType === 'mobility-scooter') out.push('- Mobility scooter user.');
  if (m?.battery?.chemistry === 'lithium-ion' && m.battery.wattHours != null) {
    out.push(`- Battery: lithium-ion, ${m.battery.wattHours} Wh.`);
  }
  if (m?.weightKg != null) out.push(`- Weight (with chair): ${m.weightKg} kg.`);
  if (m?.canTransfer === false) out.push('- Cannot transfer from chair without assistance.');
  const s = p.sensory;
  if (s?.isBlind) out.push('- Blind.');
  if (s?.isLowVision) out.push('- Low vision.');
  if (s?.isDeaf) out.push('- Deaf.');
  if (s?.isHardOfHearing) out.push('- Hard of hearing.');
  if (s?.hasGuideDog) out.push('- Travels with a guide dog.');
  if (s?.hasAssistanceDog) out.push('- Travels with an assistance dog.');
  const c = p.communication;
  if (c?.prefersBSL) out.push('- Prefers British Sign Language.');
  if (c?.prefersWriting) out.push('- Prefers written communication.');
  if (c?.needsExtraTime) out.push('- Needs extra time when speaking or reading.');
  if (p.medical?.carriesEpiPen) out.push('- Carries an EpiPen.');
  if (p.medical?.allergies && p.medical.allergies.length > 0) {
    out.push(`- Allergies: ${p.medical.allergies.join(', ')}.`);
  }
  return out;
}

export function assembleDraft(input: AssembleInput): string {
  const { incident, profile, template, operatorName, mediaSummaries = [] } = input;

  const ctx: Record<string, string> = {
    operator: operatorName ?? incident.operatorId ?? 'the operator',
    date: dateOnly(incident.startedAtISO),
    location: incident.location?.label ?? 'the location described above',
  };

  const header = fillPlaceholders(template.header, ctx);
  const legal = fillPlaceholders(template.legalParagraph, ctx);
  const ask = fillPlaceholders(template.ask, ctx);

  const facts: string[] = [
    `- Date: ${ctx.date}.`,
    `- Operator: ${ctx.operator}.`,
    `- Location: ${ctx.location}.`,
  ];
  if (incident.summary) facts.push(`- Summary: ${incident.summary}.`);
  for (const m of mediaSummaries) facts.push(`- ${m}`);

  const profileLines = profileFacts(profile);
  const aboutMe =
    profileLines.length > 0
      ? profileLines.join('\n')
      : 'I have no specific accessibility profile to share for this complaint.';

  return [
    `# ${template.title}`,
    '',
    header,
    '',
    '## What happened',
    '',
    facts.join('\n'),
    '',
    '## About me',
    '',
    aboutMe,
    '',
    '## Legal context',
    '',
    legal,
    '',
    '## What I want',
    '',
    ask,
    '',
  ].join('\n');
}
