import { assembleDraft } from './assemble';
import type { IncidentFacts } from './schemas';
import type { ComplaintTemplate } from './template-schemas';
import type { OperatorEntry } from '../content/schemas';

export interface DraftFromFactsInput {
  /** ISO date (yyyy-mm-dd or full ISO). Time component defaulted to noon UTC. */
  whenISO: string;
  operator?: OperatorEntry;
  template: ComplaintTemplate;
  accompanied?: boolean;
  narrative?: string;
  staffInteractions?: string;
  witnesses?: string;
  waitedMinutes?: number;
}

export interface DraftFromFactsOutput {
  title: string;
  facts: IncidentFacts;
  templateId: string;
  draftBody: string;
  recipient?: string;
  operatorId?: string;
}

/** Builds a draft + facts object the incidents store can save directly,
 *  given the four required intake fields (and any optional captures).
 *  Used by both the template form and the conversational AI flow. */
export function buildDraftFromFacts(input: DraftFromFactsInput): DraftFromFactsOutput {
  const {
    whenISO,
    operator,
    template,
    accompanied,
    narrative,
    staffInteractions,
    witnesses,
    waitedMinutes,
  } = input;

  const date = whenISO.length === 10 ? `${whenISO}T12:00:00Z` : whenISO;

  const facts: IncidentFacts = {
    whenISO: date,
    mode: template.mode,
    operatorName: operator?.name,
    scenarioId: template.id,
    accompanied,
    narrative,
    staffInteractions,
    witnesses,
    waitedMinutes,
  };

  const draftBody = assembleDraft({
    incident: {
      id: 'preview',
      status: 'draft',
      startedAtISO: date,
      operatorId: operator?.id,
      summary: narrative,
      events: [],
    },
    profile: { emergencyContacts: [] },
    template,
    operatorName: operator?.name,
  });

  return {
    title: `${template.title}${operator ? ` — ${operator.name}` : ''}`,
    facts,
    templateId: template.id,
    draftBody,
    recipient: operator?.complaintsRoute.primaryEmail,
    operatorId: operator?.id,
  };
}
