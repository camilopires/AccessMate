// Plain TypeScript types + data. No Zod, no platform deps. Each app
// can import these and either parse with its own validator or trust
// the shape at the boundary.

export type TransportMode = 'rail' | 'air' | 'bus' | 'taxi' | 'tfl';
export type Regulator = 'orr' | 'caa' | 'ehrc' | 'local' | 'none';

export interface OperatorEntry {
  id: string;
  name: string;
  mode: TransportMode;
  assistance: {
    phone: string;
    bookingUrl?: string;
    accessibilityPageUrl?: string;
  };
  complaintsRoute: {
    primaryEmail?: string;
    primaryUrl?: string;
    regulator: Regulator;
  };
  lastVerifiedUTC: string;
}

export interface ScenarioTemplate {
  id: string;
  title: string;
  mode: TransportMode;
  emailSubject: string;
  header: string;
  legalParagraph: string;
  ask: string;
  regulator: Regulator;
}

export type IncidentStatus = 'draft' | 'in_progress' | 'completed' | 'discarded';

export interface IncidentFacts {
  whenISO?: string;
  operatorName?: string;
  scenarioId?: string;
  narrative?: string;
  accompanied?: boolean;
  staffInteractions?: string;
  witnesses?: string;
  waitedMinutes?: number;
}

export interface Incident {
  id: string;
  status: IncidentStatus;
  startedAtISO: string;
  title?: string;
  facts?: IncidentFacts;
  templateId?: string;
  draftBody?: string;
  recipient?: string;
  operatorId?: string;
  sentAtISO?: string;
  resolvedAtISO?: string;
}

export interface Profile {
  mobility?: {
    usesWheelchair?: boolean;
    wheelchairType?: 'manual' | 'powered' | 'mobility-scooter';
  };
  sensory?: {
    isBlind?: boolean;
    isLowVision?: boolean;
    isDeaf?: boolean;
    isHardOfHearing?: boolean;
  };
  communication?: {
    prefersBSL?: boolean;
    prefersWriting?: boolean;
    needsExtraTime?: boolean;
  };
  notes?: string;
}

/** Builds a plain-text complaint draft from the facts captured. Lives
 *  in shared so every platform produces the same output for the same
 *  inputs. */
export function assembleDraft(args: {
  template: ScenarioTemplate;
  facts: IncidentFacts;
  operator?: OperatorEntry;
  profile?: Profile;
}): string {
  const { template, facts, operator, profile } = args;
  const date = (facts.whenISO ?? new Date().toISOString()).slice(0, 10);
  const operatorName = operator?.name ?? facts.operatorName ?? 'the operator';

  const fill = (text: string): string =>
    text
      .replace(/\{\{operator\}\}/g, operatorName)
      .replace(/\{\{date\}\}/g, date)
      .replace(/\{\{location\}\}/g, 'the location described above');

  const profileLines: string[] = [];
  const m = profile?.mobility;
  if (m?.wheelchairType === 'powered') profileLines.push('- Powered wheelchair user.');
  if (m?.wheelchairType === 'manual') profileLines.push('- Manual wheelchair user.');
  if (m?.wheelchairType === 'mobility-scooter') profileLines.push('- Mobility scooter user.');
  const s = profile?.sensory;
  if (s?.isBlind) profileLines.push('- Blind.');
  if (s?.isLowVision) profileLines.push('- Low vision.');
  if (s?.isDeaf) profileLines.push('- Deaf.');
  if (s?.isHardOfHearing) profileLines.push('- Hard of hearing.');
  const c = profile?.communication;
  if (c?.prefersBSL) profileLines.push('- Prefers British Sign Language.');
  if (c?.prefersWriting) profileLines.push('- Prefers written communication.');
  if (c?.needsExtraTime) profileLines.push('- Needs extra time.');

  const aboutMe = profileLines.length ? profileLines.join('\n') : 'No specific accessibility profile shared for this complaint.';

  const factLines: string[] = [
    `- Date: ${date}.`,
    `- Operator: ${operatorName}.`,
    facts.accompanied === true ? '- Travelling with a companion.' : null,
    facts.accompanied === false ? '- Travelling alone.' : null,
    facts.staffInteractions ? `- Staff interactions: ${facts.staffInteractions}.` : null,
    facts.witnesses ? `- Witnesses: ${facts.witnesses}.` : null,
    facts.waitedMinutes != null ? `- Waited approximately ${facts.waitedMinutes} minutes.` : null,
    facts.narrative ? `- Summary: ${facts.narrative}.` : null,
  ].filter((s): s is string => s !== null);

  return [
    `# ${template.title}`,
    '',
    fill(template.header),
    '',
    '## What happened',
    '',
    factLines.join('\n'),
    '',
    '## About me',
    '',
    aboutMe,
    '',
    '## Legal context',
    '',
    fill(template.legalParagraph),
    '',
    '## What I want',
    '',
    fill(template.ask),
    '',
  ].join('\n');
}
