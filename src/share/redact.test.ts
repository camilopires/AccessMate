import { describe, it, expect } from 'vitest';
import { redactStaffNames, redact } from './redact';

describe('redactStaffNames', () => {
  it('masks a single proper name following common cue words', () => {
    const r = redactStaffNames('Staff member John refused to lower the ramp.');
    expect(r).toContain('Staff member [name]');
    expect(r).not.toContain('John');
  });

  it('masks names after Conductor / Driver / Officer cues', () => {
    expect(redactStaffNames('The conductor Sarah was rude.')).toContain('conductor [name]');
    expect(redactStaffNames('Driver Mary refused.')).toContain('Driver [name]');
    expect(redactStaffNames('Officer Jane Doe stopped me.')).toContain('Officer [name]');
  });

  it('does not mask non-name words after a cue', () => {
    expect(redactStaffNames('The conductor said the train was full.')).toContain('the train');
  });
});

describe('redact', () => {
  it('optionally masks a specific operator name when requested', () => {
    const r = redact('I travelled with Avanti West Coast and they refused boarding.', {
      maskOperator: true,
      operatorName: 'Avanti West Coast',
    });
    expect(r).toContain('[operator]');
    expect(r).not.toContain('Avanti West Coast');
  });

  it('optionally masks dates and times when requested', () => {
    const r = redact('On 2026-05-23 at 10:30 the train was late.', { maskDateTime: true });
    expect(r).toContain('[date]');
    expect(r).toContain('[time]');
    expect(r).not.toContain('2026-05-23');
    expect(r).not.toContain('10:30');
  });

  it('leaves the text alone when no toggles are set', () => {
    const input = 'On 2026-05-23 with Avanti.';
    expect(redact(input, {})).toBe(input);
  });
});
