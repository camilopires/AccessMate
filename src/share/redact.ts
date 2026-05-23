function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CUES_BASE = [
  'Staff member',
  'staff member',
  'Staff',
  'staff',
  'Conductor',
  'conductor',
  'Driver',
  'driver',
  'Officer',
  'officer',
  'Agent',
  'agent',
  'Attendant',
  'attendant',
  'Manager',
  'manager',
];

const NAME_PATTERN_SRC = '[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?';

export function redactStaffNames(text: string): string {
  const cues = [...CUES_BASE].sort((a, b) => b.length - a.length);
  let out = text;
  for (const cue of cues) {
    const re = new RegExp(`\\b(${escapeRegex(cue)})\\s+(${NAME_PATTERN_SRC})\\b`, 'g');
    out = out.replace(re, '$1 [name]');
  }
  return out;
}

export interface RedactOptions {
  maskOperator?: boolean;
  operatorName?: string;
  maskDateTime?: boolean;
}

export function redact(text: string, opts: RedactOptions): string {
  let out = text;
  if (opts.maskOperator && opts.operatorName) {
    out = out.replace(new RegExp(escapeRegex(opts.operatorName), 'g'), '[operator]');
  }
  if (opts.maskDateTime) {
    out = out.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[date]');
    out = out.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, '[time]');
  }
  return out;
}
