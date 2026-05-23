import { z } from 'zod';

export const AiProvider = z.enum(['off', 'on-device', 'cloud']);
export type AiProvider = z.infer<typeof AiProvider>;

export const Settings = z.object({
  fontScale: z.number().min(1).max(2),
  highContrast: z.boolean(),
  reduceMotion: z.boolean(),
  aiProvider: AiProvider,
});
export type Settings = z.infer<typeof Settings>;

export const DEFAULTS: Settings = {
  fontScale: 1,
  highContrast: false,
  reduceMotion: false,
  aiProvider: 'off',
};

const KEY = 'accessmate.settings.v1';

export interface SettingsStore {
  get(): Settings;
  update(patch: Partial<Settings>): void;
  reset(): void;
}

export class LocalStorageSettingsStore implements SettingsStore {
  constructor(private readonly storage: Storage) {}

  get(): Settings {
    const raw = this.storage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    try {
      return Settings.parse({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      return { ...DEFAULTS };
    }
  }

  update(patch: Partial<Settings>): void {
    const next = Settings.parse({ ...this.get(), ...patch });
    this.storage.setItem(KEY, JSON.stringify(next));
  }

  reset(): void {
    this.storage.removeItem(KEY);
  }
}
