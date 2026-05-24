import { ComplaintTemplate } from '../template-schemas';
import missedPassengerAssist from './missed-passenger-assist.json';
import damagedMobilityEquipment from './damaged-mobility-equipment.json';
import refusedBoardingRail from './refused-boarding-rail.json';
import refusedBoardingAir from './refused-boarding-air.json';
import inaccessibleFacility from './inaccessible-facility.json';
import discriminatoryTreatment from './discriminatory-treatment.json';
import noAudioAnnouncements from './no-audio-announcements.json';
import bslCommunicationFailure from './bsl-communication-failure.json';
import taxiRefusal from './taxi-refusal.json';
import tflSpecific from './tfl-specific.json';

const sources: unknown[] = [
  missedPassengerAssist,
  damagedMobilityEquipment,
  refusedBoardingRail,
  refusedBoardingAir,
  inaccessibleFacility,
  discriminatoryTreatment,
  noAudioAnnouncements,
  bslCommunicationFailure,
  taxiRefusal,
  tflSpecific,
];

export function loadComplaintTemplates(): ComplaintTemplate[] {
  return sources.map((s) => ComplaintTemplate.parse(s));
}

export function getComplaintTemplate(id: string): ComplaintTemplate | null {
  return loadComplaintTemplates().find((t) => t.id === id) ?? null;
}
