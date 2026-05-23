import { Complaint } from './complaint-schemas';
import type { Clock, ComplaintCreateInput, ComplaintStore } from './complaint-store';
import { defaultClock } from './complaint-store';

const KEY = 'accessmate.complaints.v1';

export class LocalStorageComplaintStore implements ComplaintStore {
  constructor(
    private readonly storage: Storage,
    private readonly clock: Clock = defaultClock,
  ) {}

  private all(): Complaint[] {
    const raw = this.storage.getItem(KEY);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw) as unknown[];
      return arr.map((x) => Complaint.parse(x));
    } catch {
      return [];
    }
  }

  private write(arr: Complaint[]): void {
    this.storage.setItem(KEY, JSON.stringify(arr));
  }

  create(input: ComplaintCreateInput): Complaint {
    const c: Complaint = Complaint.parse({
      id: this.clock.newId(),
      incidentId: input.incidentId,
      templateId: input.templateId,
      status: 'draft',
      recipient: input.recipient,
      regulator: input.regulator,
      bodyMarkdown: input.bodyMarkdown,
      createdAtISO: this.clock.now(),
    });
    this.write([...this.all(), c]);
    return c;
  }

  get(id: string): Complaint | null {
    return this.all().find((c) => c.id === id) ?? null;
  }

  listAll(): Complaint[] {
    return this.all();
  }

  listForIncident(incidentId: string): Complaint[] {
    return this.all().filter((c) => c.incidentId === incidentId);
  }

  private mutate(id: string, patch: Partial<Complaint>): void {
    const arr = this.all();
    const idx = arr.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error(`Complaint not found: ${id}`);
    arr[idx] = Complaint.parse({ ...arr[idx], ...patch });
    this.write(arr);
  }

  markSent(id: string): void {
    this.mutate(id, { status: 'sent', sentAtISO: this.clock.now() });
  }

  markAcknowledged(id: string): void {
    this.mutate(id, { status: 'acknowledged', acknowledgedAtISO: this.clock.now() });
  }

  markResolved(id: string): void {
    this.mutate(id, { status: 'resolved', resolvedAtISO: this.clock.now() });
  }

  markEscalated(id: string): void {
    this.mutate(id, { status: 'escalated', escalatedAtISO: this.clock.now() });
  }

  setResponse(id: string, markdown: string): void {
    this.mutate(id, { responseMarkdown: markdown });
  }

  setReminderId(id: string, reminderId: string | null): void {
    this.mutate(id, { reminderId: reminderId ?? undefined });
  }
}
