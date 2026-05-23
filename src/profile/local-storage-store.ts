import { Profile } from './schemas';
import type { ProfileStore } from './store';

const KEY = 'accessmate.profile.v1';

export class LocalStorageProfileStore implements ProfileStore {
  constructor(private readonly storage: Storage) {}

  get(): Profile | null {
    const raw = this.storage.getItem(KEY);
    if (!raw) return null;
    try {
      return Profile.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  upsert(profile: Profile): void {
    const validated = Profile.parse(profile);
    this.storage.setItem(KEY, JSON.stringify(validated));
  }
}
