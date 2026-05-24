import { describe, test, expect } from 'bun:test';
import { assembleDraft } from '@accessmate/shared';
import type { OperatorEntry, Profile, ScenarioTemplate, IncidentFacts } from '@accessmate/shared';
import fixtures from '../../../packages/shared/test-fixtures/draft-cases.json';

interface Case {
  name: string;
  template: ScenarioTemplate;
  facts: IncidentFacts;
  operator: OperatorEntry | null;
  profile: Profile | null;
  expected: string;
}

describe('assembleDraft parity', () => {
  for (const c of fixtures.cases as Case[]) {
    test(c.name, () => {
      const out = assembleDraft({
        template: c.template,
        facts: c.facts,
        operator: c.operator ?? undefined,
        profile: c.profile ?? undefined,
      });
      expect(out).toBe(c.expected);
    });
  }
});
