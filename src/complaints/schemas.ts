import { z } from 'zod';
import { TransportMode, Regulator } from '../content/schemas';

export const ComplaintTemplate = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  mode: TransportMode,
  emailSubject: z.string().min(1),
  header: z.string().min(1),
  legalParagraph: z.string().min(1),
  ask: z.string().min(1),
  regulator: Regulator,
});
export type ComplaintTemplate = z.infer<typeof ComplaintTemplate>;
