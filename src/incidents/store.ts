import type { Incident, MediaRef, Location } from './schemas';

export interface IncidentStartInput {
  operatorId?: string;
  tripId?: string;
  location?: Location;
}

export interface MediaInput {
  kind: MediaRef['kind'];
  fileUri?: string;
  textBody?: string;
}

export interface IncidentStore {
  start(input: IncidentStartInput): Incident;
  get(id: string): Incident | null;
  listInProgress(): Incident[];
  listAll(): Incident[];
  markComplete(id: string, summary?: string): void;
  discard(id: string): void;
  attachMedia(incidentId: string, media: MediaInput): MediaRef;
  mediaFor(incidentId: string): MediaRef[];
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
