import type { SqliteAdapter } from '../db/migrator';
import { Complaint } from './complaint-schemas';
import type { Clock, ComplaintCreateInput, ComplaintStore } from './complaint-store';
import { defaultClock } from './complaint-store';

interface Row {
  id: string;
  incident_id: string;
  template_id: string;
  status: Complaint['status'];
  recipient: string | null;
  regulator: string | null;
  body_markdown: string | null;
  response_markdown: string | null;
  created_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  escalated_at: string | null;
  reminder_id: string | null;
}

function rowToComplaint(r: Row): Complaint {
  return Complaint.parse({
    id: r.id,
    incidentId: r.incident_id,
    templateId: r.template_id,
    status: r.status,
    recipient: r.recipient ?? undefined,
    regulator: r.regulator ?? undefined,
    bodyMarkdown: r.body_markdown ?? undefined,
    responseMarkdown: r.response_markdown ?? undefined,
    createdAtISO: r.created_at,
    sentAtISO: r.sent_at ?? undefined,
    acknowledgedAtISO: r.acknowledged_at ?? undefined,
    resolvedAtISO: r.resolved_at ?? undefined,
    escalatedAtISO: r.escalated_at ?? undefined,
    reminderId: r.reminder_id ?? undefined,
  });
}

export class SqliteComplaintStore implements ComplaintStore {
  constructor(
    private readonly db: SqliteAdapter,
    private readonly clock: Clock = defaultClock,
  ) {}

  create(input: ComplaintCreateInput): Complaint {
    const id = this.clock.newId();
    const createdAt = this.clock.now();
    this.db.runSync(
      `INSERT INTO complaints (id, incident_id, template_id, status, recipient, regulator, body_markdown, created_at)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?)`,
      [
        id,
        input.incidentId,
        input.templateId,
        input.recipient ?? null,
        input.regulator ?? null,
        input.bodyMarkdown ?? null,
        createdAt,
      ],
    );
    return this.get(id)!;
  }

  get(id: string): Complaint | null {
    const row = this.db.getFirstSync<Row>(`SELECT * FROM complaints WHERE id = ?`, [id]);
    return row ? rowToComplaint(row) : null;
  }

  listAll(): Complaint[] {
    return this.db
      .getAllSync<Row>(`SELECT * FROM complaints ORDER BY created_at DESC`)
      .map(rowToComplaint);
  }

  listForIncident(incidentId: string): Complaint[] {
    return this.db
      .getAllSync<Row>(`SELECT * FROM complaints WHERE incident_id = ?`, [incidentId])
      .map(rowToComplaint);
  }

  markSent(id: string): void {
    this.db.runSync(`UPDATE complaints SET status = 'sent', sent_at = ? WHERE id = ?`, [
      this.clock.now(),
      id,
    ]);
  }

  markAcknowledged(id: string): void {
    this.db.runSync(
      `UPDATE complaints SET status = 'acknowledged', acknowledged_at = ? WHERE id = ?`,
      [this.clock.now(), id],
    );
  }

  markResolved(id: string): void {
    this.db.runSync(`UPDATE complaints SET status = 'resolved', resolved_at = ? WHERE id = ?`, [
      this.clock.now(),
      id,
    ]);
  }

  markEscalated(id: string): void {
    this.db.runSync(`UPDATE complaints SET status = 'escalated', escalated_at = ? WHERE id = ?`, [
      this.clock.now(),
      id,
    ]);
  }

  setResponse(id: string, markdown: string): void {
    this.db.runSync(`UPDATE complaints SET response_markdown = ? WHERE id = ?`, [markdown, id]);
  }

  setReminderId(id: string, reminderId: string | null): void {
    this.db.runSync(`UPDATE complaints SET reminder_id = ? WHERE id = ?`, [reminderId, id]);
  }
}
