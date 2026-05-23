import type { Complaint } from './complaint-schemas';
import type { Regulator } from '../content/schemas';

export interface ComplaintCreateInput {
  incidentId: string;
  templateId: string;
  recipient?: string;
  regulator?: Regulator;
  bodyMarkdown?: string;
}

export interface ComplaintStore {
  create(input: ComplaintCreateInput): Complaint;
  get(id: string): Complaint | null;
  listAll(): Complaint[];
  listForIncident(incidentId: string): Complaint[];
  markSent(id: string): void;
  markAcknowledged(id: string): void;
  markResolved(id: string): void;
  markEscalated(id: string): void;
  setResponse(id: string, markdown: string): void;
  setReminderId(id: string, reminderId: string | null): void;
}

export interface Clock {
  newId(): string;
  now(): string;
}

export const defaultClock: Clock = {
  newId: () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  now: () => new Date().toISOString(),
};
