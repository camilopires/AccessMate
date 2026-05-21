import { z } from 'zod';

export const TransportMode = z.enum(['rail', 'air', 'bus', 'taxi', 'tfl']);
export type TransportMode = z.infer<typeof TransportMode>;

export const Regulator = z.enum(['orr', 'caa', 'ehrc', 'local', 'none']);
export type Regulator = z.infer<typeof Regulator>;

export const OperatorEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  mode: TransportMode,
  assistance: z.object({
    phone: z.string().regex(/^\+?[0-9-]+$/),
    bookingUrl: z.string().url().optional(),
    accessibilityPageUrl: z.string().url().optional(),
  }),
  complaintsRoute: z.object({
    primaryEmail: z.string().email().optional(),
    primaryUrl: z.string().url().optional(),
    regulator: Regulator,
  }),
  lastVerifiedUTC: z.string().datetime(),
});
export type OperatorEntry = z.infer<typeof OperatorEntry>;
