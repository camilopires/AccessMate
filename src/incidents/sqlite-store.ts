import type { SqliteAdapter } from '../db/migrator';
import { Incident, MediaRef } from './schemas';
import type { Clock, DraftInput, IncidentStartInput, IncidentStore, MediaInput } from './store';
import type { IncidentEvent } from './schemas';
import { defaultClock } from './store';

interface IncidentRow {
  id: string;
  status: 'draft' | 'in_progress' | 'completed' | 'discarded';
  started_at: string;
  completed_at: string | null;
  summary: string | null;
  operator_id: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
  trip_id: string | null;
  title: string | null;
  scenario_id: string | null;
  narrative: string | null;
  accompanied: number | null;
  staff_interactions: string | null;
  witnesses: string | null;
  waited_minutes: number | null;
  template_id: string | null;
  draft_body: string | null;
  recipient: string | null;
  sent_at: string | null;
  resolved_at: string | null;
  reminder_id: string | null;
  events_json: string;
}

interface MediaRow {
  id: string;
  incident_id: string;
  kind: 'photo' | 'audio' | 'note';
  file_uri: string | null;
  text_body: string | null;
  captured_at: string;
}

function parseEvents(json: string): IncidentEvent[] {
  try {
    const arr = JSON.parse(json) as unknown[];
    return Incident.parse({
      id: 'tmp',
      status: 'draft',
      startedAtISO: '2026-01-01T00:00:00Z',
      events: arr,
    }).events;
  } catch {
    return [];
  }
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
    title: r.title ?? undefined,
    facts:
      r.scenario_id || r.narrative || r.accompanied != null || r.waited_minutes != null
        ? {
            scenarioId: r.scenario_id ?? undefined,
            narrative: r.narrative ?? undefined,
            accompanied: r.accompanied == null ? undefined : Boolean(r.accompanied),
            staffInteractions: r.staff_interactions ?? undefined,
            witnesses: r.witnesses ?? undefined,
            waitedMinutes: r.waited_minutes ?? undefined,
          }
        : undefined,
    templateId: r.template_id ?? undefined,
    draftBody: r.draft_body ?? undefined,
    recipient: r.recipient ?? undefined,
    sentAtISO: r.sent_at ?? undefined,
    resolvedAtISO: r.resolved_at ?? undefined,
    reminderId: r.reminder_id ?? undefined,
    events: parseEvents(r.events_json ?? '[]'),
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
         (id, status, started_at, operator_id, trip_id, location_lat, location_lng, location_label, events_json)
       VALUES (?, 'in_progress', ?, ?, ?, ?, ?, ?, '[]')`,
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

  saveDraft(input: DraftInput): Incident {
    const id = this.clock.newId();
    const startedAt = this.clock.now();
    this.db.runSync(
      `INSERT INTO incidents
         (id, status, started_at, operator_id, location_lat, location_lng, location_label,
          title, scenario_id, narrative, accompanied, staff_interactions, witnesses, waited_minutes,
          template_id, draft_body, recipient, events_json)
       VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')`,
      [
        id,
        startedAt,
        input.operatorId ?? null,
        input.location?.lat ?? null,
        input.location?.lng ?? null,
        input.location?.label ?? null,
        input.title ?? null,
        input.facts?.scenarioId ?? null,
        input.facts?.narrative ?? null,
        input.facts?.accompanied == null ? null : input.facts.accompanied ? 1 : 0,
        input.facts?.staffInteractions ?? null,
        input.facts?.witnesses ?? null,
        input.facts?.waitedMinutes ?? null,
        input.templateId ?? null,
        input.draftBody ?? null,
        input.recipient ?? null,
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

  listByStatus(status: 'draft' | 'in_progress' | 'completed'): Incident[] {
    return this.selectAll(`SELECT * FROM incidents WHERE status = ? ORDER BY started_at DESC`, [
      status,
    ]);
  }

  private selectAll(sql: string, params: unknown[] = []): Incident[] {
    return this.db.getAllSync<IncidentRow>(sql, params).map(rowToIncident);
  }

  markComplete(id: string, summary?: string): void {
    if (!this.get(id)) throw new Error(`Incident not found: ${id}`);
    this.db.runSync(
      `UPDATE incidents SET status = 'completed', completed_at = ?, resolved_at = ?, summary = COALESCE(?, summary) WHERE id = ?`,
      [this.clock.now(), this.clock.now(), summary ?? null, id],
    );
  }

  markSent(id: string): void {
    if (!this.get(id)) throw new Error(`Incident not found: ${id}`);
    this.db.runSync(`UPDATE incidents SET status = 'in_progress', sent_at = ? WHERE id = ?`, [
      this.clock.now(),
      id,
    ]);
  }

  markCompleted(id: string): void {
    const cur = this.get(id);
    if (!cur) throw new Error(`Incident not found: ${id}`);
    const now = this.clock.now();
    const events: IncidentEvent[] = [...cur.events, { kind: 'marked_resolved', atISO: now }];
    this.db.runSync(
      `UPDATE incidents SET status = 'completed', completed_at = ?, resolved_at = ?, events_json = ? WHERE id = ?`,
      [now, now, JSON.stringify(events), id],
    );
  }

  appendEvent(id: string, event: IncidentEvent): void {
    const cur = this.get(id);
    if (!cur) throw new Error(`Incident not found: ${id}`);
    const events: IncidentEvent[] = [...cur.events, event];
    this.db.runSync(`UPDATE incidents SET events_json = ? WHERE id = ?`, [
      JSON.stringify(events),
      id,
    ]);
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
    return this.db
      .getAllSync<MediaRow>(`SELECT * FROM media_refs WHERE incident_id = ? ORDER BY captured_at`, [
        incidentId,
      ])
      .map(rowToMedia);
  }
}
