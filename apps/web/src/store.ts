import type { Incident, IncidentStatus, Profile } from '@accessmate/shared';

const INCIDENTS_KEY = 'accessmate.web.incidents.v1';
const PROFILE_KEY = 'accessmate.web.profile.v1';
const SETTINGS_KEY = 'accessmate.web.settings.v1';

export interface Settings {
  fontScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  fontScale: 1,
  highContrast: false,
  reduceMotion: false,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listIncidents(): Incident[] {
  return safeParse<Incident[]>(localStorage.getItem(INCIDENTS_KEY), []);
}

export function saveIncident(incident: Incident): void {
  const all = listIncidents();
  const idx = all.findIndex((i) => i.id === incident.id);
  if (idx >= 0) all[idx] = incident;
  else all.push(incident);
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(all));
}

export function deleteIncident(id: string): void {
  const all = listIncidents().filter((i) => i.id !== id);
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(all));
}

export function getIncident(id: string): Incident | undefined {
  return listIncidents().find((i) => i.id === id);
}

export function updateIncident(id: string, patch: Partial<Incident>): Incident | undefined {
  const existing = getIncident(id);
  if (!existing) return undefined;
  const next: Incident = { ...existing, ...patch };
  saveIncident(next);
  return next;
}

export function setStatus(id: string, status: IncidentStatus): void {
  updateIncident(id, { status });
}

export function getProfile(): Profile {
  return safeParse<Profile>(localStorage.getItem(PROFILE_KEY), {});
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getSettings(): Settings {
  return safeParse<Settings>(localStorage.getItem(SETTINGS_KEY), DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function newIncidentId(): string {
  return `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
