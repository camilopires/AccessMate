import { Incident, MediaRef } from './schemas';
import type {
  Clock,
  DraftInput,
  IncidentStartInput,
  IncidentStore,
  MediaInput,
} from './store';
import type { IncidentEvent } from './schemas';
import { defaultClock } from './store';

const KEY_INCIDENTS = 'accessmate.incidents.v1';
const KEY_MEDIA = 'accessmate.media.v1';

export class LocalStorageIncidentStore implements IncidentStore {
  constructor(
    private readonly storage: Storage,
    private readonly clock: Clock = defaultClock
  ) {}

  private readArr<T>(key: string, schema: { parse: (x: unknown) => T }): T[] {
    const raw = this.storage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown[];
      return parsed.map((x) => schema.parse(x));
    } catch {
      return [];
    }
  }

  private writeArr(key: string, arr: unknown[]): void {
    this.storage.setItem(key, JSON.stringify(arr));
  }

  private incidents(): Incident[] {
    return this.readArr(KEY_INCIDENTS, Incident);
  }

  private media(): MediaRef[] {
    return this.readArr(KEY_MEDIA, MediaRef);
  }

  start(input: IncidentStartInput): Incident {
    const inc: Incident = Incident.parse({
      id: this.clock.newId(),
      status: 'in_progress',
      startedAtISO: this.clock.now(),
      operatorId: input.operatorId,
      tripId: input.tripId,
      location: input.location,
    });
    this.writeArr(KEY_INCIDENTS, [...this.incidents(), inc]);
    return inc;
  }

  saveDraft(input: DraftInput): Incident {
    const inc: Incident = Incident.parse({
      id: this.clock.newId(),
      status: 'draft',
      startedAtISO: this.clock.now(),
      title: input.title,
      operatorId: input.operatorId,
      location: input.location,
      facts: input.facts,
      templateId: input.templateId,
      draftBody: input.draftBody,
      recipient: input.recipient,
      events: [],
    });
    this.writeArr(KEY_INCIDENTS, [...this.incidents(), inc]);
    return inc;
  }

  get(id: string): Incident | null {
    return this.incidents().find((i) => i.id === id) ?? null;
  }

  listInProgress(): Incident[] {
    return this.incidents().filter((i) => i.status === 'in_progress');
  }

  listAll(): Incident[] {
    return this.incidents();
  }

  listByStatus(status: 'draft' | 'in_progress' | 'completed'): Incident[] {
    return this.incidents().filter((i) => i.status === status);
  }

  private mutate(id: string, patch: Partial<Incident>): void {
    const arr = this.incidents();
    const idx = arr.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error(`Incident not found: ${id}`);
    arr[idx] = Incident.parse({ ...arr[idx], ...patch });
    this.writeArr(KEY_INCIDENTS, arr);
  }

  markComplete(id: string, summary?: string): void {
    this.mutate(id, {
      status: 'completed',
      completedAtISO: this.clock.now(),
      resolvedAtISO: this.clock.now(),
      summary: summary ?? this.get(id)?.summary,
    });
  }

  markSent(id: string): void {
    this.mutate(id, { status: 'in_progress', sentAtISO: this.clock.now() });
  }

  markCompleted(id: string): void {
    const now = this.clock.now();
    const arr = this.incidents();
    const idx = arr.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error(`Incident not found: ${id}`);
    arr[idx] = Incident.parse({
      ...arr[idx],
      status: 'completed',
      completedAtISO: now,
      resolvedAtISO: now,
      events: [...arr[idx].events, { kind: 'marked_resolved', atISO: now }],
    });
    this.writeArr(KEY_INCIDENTS, arr);
  }

  appendEvent(id: string, event: IncidentEvent): void {
    const arr = this.incidents();
    const idx = arr.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error(`Incident not found: ${id}`);
    arr[idx] = Incident.parse({
      ...arr[idx],
      events: [...arr[idx].events, event],
    });
    this.writeArr(KEY_INCIDENTS, arr);
  }

  discard(id: string): void {
    this.mutate(id, { status: 'discarded' });
  }

  attachMedia(incidentId: string, m: MediaInput): MediaRef {
    if (!this.get(incidentId)) throw new Error(`Incident not found: ${incidentId}`);
    const ref: MediaRef = MediaRef.parse({
      id: this.clock.newId(),
      incidentId,
      kind: m.kind,
      fileUri: m.fileUri,
      textBody: m.textBody,
      capturedAtISO: this.clock.now(),
    });
    this.writeArr(KEY_MEDIA, [...this.media(), ref]);
    return ref;
  }

  mediaFor(incidentId: string): MediaRef[] {
    return this.media().filter((m) => m.incidentId === incidentId);
  }
}
