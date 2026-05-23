import type { SqliteAdapter } from '../db/migrator';
import { Profile } from './schemas';

interface ProfileRow {
  id: number;
  data: string;
  updated_at: string;
}

export class ProfileRepository {
  constructor(private readonly db: SqliteAdapter) {}

  get(): Profile | null {
    const row = this.db.getFirstSync<ProfileRow>(
      `SELECT id, data, updated_at FROM profile WHERE id = 1`,
    );
    if (!row) return null;
    return Profile.parse(JSON.parse(row.data));
  }

  upsert(profile: Profile): void {
    const validated = Profile.parse(profile);
    this.db.runSync(
      `INSERT OR REPLACE INTO profile (id, data, updated_at) VALUES (1, ?, datetime('now'))`,
      [JSON.stringify(validated)],
    );
  }
}
