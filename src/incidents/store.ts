import type { Incident, IncidentEvent, IncidentFacts, MediaRef, Location } from './schemas';

export interface IncidentStartInput {
  operatorId?: string;
  tripId?: string;
  location?: Location;
}

export interface DraftInput {
  title?: string;
  operatorId?: string;
  location?: Location;
  facts?: IncidentFacts;
  templateId?: string;
  draftBody?: string;
  recipient?: string;
}

export interface MediaInput {
  kind: MediaRef['kind'];
  fileUri?: string;
  textBody?: string;
}

export interface IncidentStore {
  // Existing — kept for any callers still on the legacy flow.
  start(input: IncidentStartInput): Incident;
  get(id: string): Incident | null;
  listInProgress(): Incident[];
  listAll(): Incident[];
  markComplete(id: string, summary?: string): void;
  discard(id: string): void;
  attachMedia(incidentId: string, media: MediaInput): MediaRef;
  mediaFor(incidentId: string): MediaRef[];

  // v0.2:
  saveDraft(input: DraftInput): Incident;
  markSent(id: string): void;
  markCompleted(id: string): void;
  appendEvent(id: string, event: IncidentEvent): void;
  listByStatus(status: 'draft' | 'in_progress' | 'completed'): Incident[];
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
