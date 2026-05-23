import { Incident, MediaRef } from './schemas';
import type { Clock, IncidentStartInput, IncidentStore, MediaInput } from './store';
import { defaultClock } from './store';

const KEY_INCIDENTS = 'accessmate.incidents.v1';
const KEY_MEDIA = 'accessmate.media.v1';

export class LocalStorageIncidentStore implements IncidentStore {
  constructor(
    private readonly storage: Storage,
    private readonly clock: Clock = defaultClock,
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
    const next = [...this.incidents(), inc];
    this.writeArr(KEY_INCIDENTS, next);
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

  markComplete(id: string, summary?: string): void {
    const arr = this.incidents();
    const idx = arr.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error(`Incident not found: ${id}`);
    arr[idx] = Incident.parse({
      ...arr[idx],
      status: 'completed',
      completedAtISO: this.clock.now(),
      summary: summary ?? arr[idx].summary,
    });
    this.writeArr(KEY_INCIDENTS, arr);
  }

  discard(id: string): void {
    const arr = this.incidents();
    const idx = arr.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error(`Incident not found: ${id}`);
    arr[idx] = Incident.parse({ ...arr[idx], status: 'discarded' });
    this.writeArr(KEY_INCIDENTS, arr);
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
    const next = [...this.media(), ref];
    this.writeArr(KEY_MEDIA, next);
    return ref;
  }

  mediaFor(incidentId: string): MediaRef[] {
    return this.media().filter((m) => m.incidentId === incidentId);
  }
}
