import { z } from 'zod';
import { TransportMode, Regulator } from '../content/schemas';

export const IncidentStatus = z.enum(['draft', 'in_progress', 'completed', 'discarded']);
export type IncidentStatus = z.infer<typeof IncidentStatus>;

export const MediaKind = z.enum(['photo', 'audio', 'note']);
export type MediaKind = z.infer<typeof MediaKind>;

export const Location = z.object({
  lat: z.number(),
  lng: z.number(),
  label: z.string().optional(),
});
export type Location = z.infer<typeof Location>;

export const IncidentFacts = z.object({
  whenISO: z.string().datetime().optional(),
  mode: TransportMode.optional(),
  operatorName: z.string().optional(),
  scenarioId: z.string().optional(),
  narrative: z.string().optional(),
  accompanied: z.boolean().optional(),
  staffInteractions: z.string().optional(),
  witnesses: z.string().optional(),
  waitedMinutes: z.number().nonnegative().optional(),
});
export type IncidentFacts = z.infer<typeof IncidentFacts>;

export const IncidentEvent = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('escalated_to_regulator'),
    atISO: z.string().datetime(),
    regulator: Regulator,
    draftBody: z.string(),
  }),
  z.object({
    kind: z.literal('operator_response'),
    atISO: z.string().datetime(),
    bodyMarkdown: z.string(),
  }),
  z.object({
    kind: z.literal('marked_resolved'),
    atISO: z.string().datetime(),
    note: z.string().optional(),
  }),
]);
export type IncidentEvent = z.infer<typeof IncidentEvent>;

export const Incident = z.object({
  id: z.string().min(1),
  status: IncidentStatus,
  startedAtISO: z.string().datetime(),
  completedAtISO: z.string().datetime().optional(),
  summary: z.string().optional(),
  operatorId: z.string().optional(),
  location: Location.optional(),
  tripId: z.string().optional(),

  // v0.2 merged from Complaint:
  title: z.string().optional(),
  facts: IncidentFacts.optional(),
  templateId: z.string().optional(),
  draftBody: z.string().optional(),
  recipient: z.string().optional(),
  sentAtISO: z.string().datetime().optional(),
  resolvedAtISO: z.string().datetime().optional(),
  reminderId: z.string().optional(),
  events: z.array(IncidentEvent).default([]),
});
export type Incident = z.infer<typeof Incident>;

export const MediaRef = z
  .object({
    id: z.string().min(1),
    incidentId: z.string().min(1),
    kind: MediaKind,
    fileUri: z.string().optional(),
    textBody: z.string().optional(),
    capturedAtISO: z.string().datetime(),
  })
  .refine((m) => (m.kind === 'note' ? !!m.textBody : !!m.fileUri), {
    message: 'photo/audio require fileUri; note requires textBody',
  });
export type MediaRef = z.infer<typeof MediaRef>;
