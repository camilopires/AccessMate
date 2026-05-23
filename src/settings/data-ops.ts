import { Platform } from 'react-native';
import { getProfileStore } from '../profile/store';
import { getIncidentStore } from '../incidents/factory';
import { getComplaintStore } from '../complaints/factory';

export async function exportAllData(): Promise<void> {
  const profile = getProfileStore().get();
  const incidents = getIncidentStore().listAll();
  const complaints = getComplaintStore().listAll();
  const media = incidents.flatMap((i) => getIncidentStore().mediaFor(i.id));
  const payload = {
    version: 1,
    exportedAtISO: new Date().toISOString(),
    profile,
    incidents,
    media,
    complaints,
  };
  const json = JSON.stringify(payload, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessmate-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // Native: write to file-system + open share sheet via expo-sharing.
  // Lazy import so the web build doesn't pull native modules. SDK 54 ships
  // a new File class under expo-file-system; the legacy API stays on
  // expo-file-system/legacy.
  const FileSystem =
    (await import('expo-file-system/legacy')) as typeof import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing').catch(() => null);
  const path = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ''}accessmate-export.json`;
  await FileSystem.writeAsStringAsync(path, json);
  if (Sharing && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(path);
  }
}

export function wipeAllData(): void {
  if (Platform.OS === 'web') {
    const keys = [
      'accessmate.profile.v1',
      'accessmate.incidents.v1',
      'accessmate.media.v1',
      'accessmate.complaints.v1',
      'accessmate.settings.v1',
    ];
    for (const k of keys) window.localStorage.removeItem(k);
    return;
  }
  // Native: drop and recreate the sqlite tables.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { getDatabase } = require('../db') as typeof import('../db');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const db = getDatabase();
  db.execSync(`
    DROP TABLE IF EXISTS complaints;
    DROP TABLE IF EXISTS media_refs;
    DROP TABLE IF EXISTS incidents;
    DROP TABLE IF EXISTS trips;
    DROP TABLE IF EXISTS profile;
    DROP TABLE IF EXISTS schema_version;
  `);
}
