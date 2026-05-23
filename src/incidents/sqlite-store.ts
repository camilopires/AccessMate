import type { SqliteAdapter } from '../db/migrator';
import { Incident, MediaRef } from './schemas';
import type { Clock, IncidentStartInput, IncidentStore, MediaInput } from './store';
import { defaultClock } from './store';

interface IncidentRow {
  id: string;
  status: 'in_progress' | 'completed' | 'discarded';
  started_at: string;
  completed_at: string | null;
  summary: string | null;
  operator_id: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
  trip_id: string | null;
}

interface MediaRow {
  id: string;
  incident_id: string;
  kind: 'photo' | 'audio' | 'note';
  file_uri: string | null;
  text_body: string | null;
  captured_at: string;
}

function rowToIncident(r: IncidentRow): Incident {
  return Incident.parse({
    id: r.id,
    status: r.status,
    startedAtISO: r.started_at,
    completedAtISO: r.completed_at ?? undefined,
    summary: r.summary ?? undefined,
    operatorId: r.operator_id ?? undefined,
    tripId: r.trip_id ?? undefined,
    location:
      r.location_lat != null && r.location_lng != null
        ? { lat: r.location_lat, lng: r.location_lng, label: r.location_label ?? undefined }
        : undefined,
  });
}

function rowToMedia(r: MediaRow): MediaRef {
  return MediaRef.parse({
    id: r.id,
    incidentId: r.incident_id,
    kind: r.kind,
    fileUri: r.file_uri ?? undefined,
    textBody: r.text_body ?? undefined,
    capturedAtISO: r.captured_at,
  });
}

export class SqliteIncidentStore implements IncidentStore {
  constructor(
    private readonly db: SqliteAdapter,
    private readonly clock: Clock = defaultClock,
  ) {}

  start(input: IncidentStartInput): Incident {
    const id = this.clock.newId();
    const startedAt = this.clock.now();
    this.db.runSync(
      `INSERT INTO incidents
         (id, status, started_at, operator_id, trip_id, location_lat, location_lng, location_label)
       VALUES (?, 'in_progress', ?, ?, ?, ?, ?, ?)`,
      [
        id,
        startedAt,
        input.operatorId ?? null,
        input.tripId ?? null,
        input.location?.lat ?? null,
        input.location?.lng ?? null,
        input.location?.label ?? null,
      ],
    );
    return this.get(id)!;
  }

  get(id: string): Incident | null {
    const row = this.db.getFirstSync<IncidentRow>(`SELECT * FROM incidents WHERE id = ?`, [id]);
    return row ? rowToIncident(row) : null;
  }

  listInProgress(): Incident[] {
    return this.selectAll(`SELECT * FROM incidents WHERE status = 'in_progress'`);
  }

  listAll(): Incident[] {
    return this.selectAll(`SELECT * FROM incidents ORDER BY started_at DESC`);
  }

  private selectAll(sql: string, params: unknown[] = []): Incident[] {
    const rows = this.db.getAllSync<IncidentRow>(sql, params);
    return rows.map(rowToIncident);
  }

  markComplete(id: string, summary?: string): void {
    if (!this.get(id)) throw new Error(`Incident not found: ${id}`);
    this.db.runSync(
      `UPDATE incidents SET status = 'completed', completed_at = ?, summary = COALESCE(?, summary) WHERE id = ?`,
      [this.clock.now(), summary ?? null, id],
    );
  }

  discard(id: string): void {
    if (!this.get(id)) throw new Error(`Incident not found: ${id}`);
    this.db.runSync(`UPDATE incidents SET status = 'discarded' WHERE id = ?`, [id]);
  }

  attachMedia(incidentId: string, m: MediaInput): MediaRef {
    if (!this.get(incidentId)) throw new Error(`Incident not found: ${incidentId}`);
    const validated = MediaRef.parse({
      id: this.clock.newId(),
      incidentId,
      kind: m.kind,
      fileUri: m.fileUri,
      textBody: m.textBody,
      capturedAtISO: this.clock.now(),
    });
    this.db.runSync(
      `INSERT INTO media_refs (id, incident_id, kind, file_uri, text_body, captured_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        validated.id,
        validated.incidentId,
        validated.kind,
        validated.fileUri ?? null,
        validated.textBody ?? null,
        validated.capturedAtISO,
      ],
    );
    return validated;
  }

  mediaFor(incidentId: string): MediaRef[] {
    const rows = this.db.getAllSync<MediaRow>(
      `SELECT * FROM media_refs WHERE incident_id = ? ORDER BY captured_at`,
      [incidentId],
    );
    return rows.map(rowToMedia);
  }
}
