import { z } from 'zod';

export const IncidentStatus = z.enum(['in_progress', 'completed', 'discarded']);
export type IncidentStatus = z.infer<typeof IncidentStatus>;

export const MediaKind = z.enum(['photo', 'audio', 'note']);
export type MediaKind = z.infer<typeof MediaKind>;

export const Location = z.object({
  lat: z.number(),
  lng: z.number(),
  label: z.string().optional(),
});
export type Location = z.infer<typeof Location>;

export const Incident = z.object({
  id: z.string().min(1),
  status: IncidentStatus,
  startedAtISO: z.string().datetime(),
  completedAtISO: z.string().datetime().optional(),
  summary: z.string().optional(),
  operatorId: z.string().optional(),
  location: Location.optional(),
  tripId: z.string().optional(),
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
