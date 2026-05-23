import { z } from 'zod';
import { Regulator } from '../content/schemas';

export const ComplaintStatus = z.enum(['draft', 'sent', 'acknowledged', 'resolved', 'escalated']);
export type ComplaintStatus = z.infer<typeof ComplaintStatus>;

export const Complaint = z.object({
  id: z.string().min(1),
  incidentId: z.string().min(1),
  templateId: z.string().min(1),
  status: ComplaintStatus,
  recipient: z.string().optional(),
  regulator: Regulator.optional(),
  bodyMarkdown: z.string().optional(),
  responseMarkdown: z.string().optional(),
  createdAtISO: z.string().datetime(),
  sentAtISO: z.string().datetime().optional(),
  acknowledgedAtISO: z.string().datetime().optional(),
  resolvedAtISO: z.string().datetime().optional(),
  escalatedAtISO: z.string().datetime().optional(),
  reminderId: z.string().optional(),
});
export type Complaint = z.infer<typeof Complaint>;
