import { z } from 'zod';

const PhoneNumber = z.string().regex(/^\+?[0-9 \-()]+$/, 'invalid phone');

export const WheelchairType = z.enum(['manual', 'powered', 'mobility-scooter']);
export type WheelchairType = z.infer<typeof WheelchairType>;

export const BatteryChemistry = z.enum([
  'lithium-ion',
  'lithium-iron-phosphate',
  'sealed-lead-acid',
  'gel-cell',
  'wet-cell',
  'dry-cell',
  'other',
]);
export type BatteryChemistry = z.infer<typeof BatteryChemistry>;

export const BatterySpec = z.object({
  chemistry: BatteryChemistry,
  wattHours: z.number().nonnegative().optional(),
  isDryCell: z.boolean().optional(),
  isSpillable: z.boolean().optional(),
});
export type BatterySpec = z.infer<typeof BatterySpec>;

export const MobilityProfile = z.object({
  usesWheelchair: z.boolean().optional(),
  wheelchairType: WheelchairType.optional(),
  battery: BatterySpec.optional(),
  weightKg: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  canTransfer: z.boolean().optional(),
  transferNotes: z.string().optional(),
});
export type MobilityProfile = z.infer<typeof MobilityProfile>;

export const SensoryProfile = z.object({
  isBlind: z.boolean().optional(),
  isLowVision: z.boolean().optional(),
  isDeaf: z.boolean().optional(),
  isHardOfHearing: z.boolean().optional(),
  hasGuideDog: z.boolean().optional(),
  hasAssistanceDog: z.boolean().optional(),
});
export type SensoryProfile = z.infer<typeof SensoryProfile>;

export const CommunicationProfile = z.object({
  prefersBSL: z.boolean().optional(),
  prefersWriting: z.boolean().optional(),
  prefersSpeech: z.boolean().optional(),
  needsExtraTime: z.boolean().optional(),
  notes: z.string().optional(),
});
export type CommunicationProfile = z.infer<typeof CommunicationProfile>;

export const Medication = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  notes: z.string().optional(),
});
export type Medication = z.infer<typeof Medication>;

export const MedicalProfile = z.object({
  conditions: z.array(z.string()).optional(),
  medications: z.array(Medication).optional(),
  allergies: z.array(z.string()).optional(),
  carriesEpiPen: z.boolean().optional(),
  notes: z.string().optional(),
});
export type MedicalProfile = z.infer<typeof MedicalProfile>;

export const EmergencyContact = z.object({
  name: z.string().min(1),
  relationship: z.string().optional(),
  phone: PhoneNumber,
  notes: z.string().optional(),
});
export type EmergencyContact = z.infer<typeof EmergencyContact>;

export const BlueBadge = z.object({
  holder: z.boolean(),
  number: z.string().optional(),
  expiryISO: z.string().optional(),
});
export type BlueBadge = z.infer<typeof BlueBadge>;

export const Profile = z.object({
  mobility: MobilityProfile.optional(),
  sensory: SensoryProfile.optional(),
  communication: CommunicationProfile.optional(),
  medical: MedicalProfile.optional(),
  emergencyContacts: z.array(EmergencyContact).default([]),
  blueBadge: BlueBadge.optional(),
  notes: z.string().optional(),
});
export type Profile = z.infer<typeof Profile>;

export const EMPTY_PROFILE: Profile = Profile.parse({});
