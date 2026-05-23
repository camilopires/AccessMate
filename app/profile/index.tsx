import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { PassportView } from '../../src/profile/PassportView';
import { ProfileRepository } from '../../src/profile/repository';
import { ExpoSqliteAdapter } from '../../src/db/sqlite-adapter';
import { getDatabase } from '../../src/db';
import { exportPassportPdf } from '../../src/profile/pdf';
import type { Profile } from '../../src/profile/schemas';

const EMPTY: Profile = { emergencyContacts: [] };

export default function ProfileScreen() {
  const router = useRouter();
  const repo = useMemo(() => new ProfileRepository(new ExpoSqliteAdapter(getDatabase())), []);
  const [profile] = useState<Profile>(() => repo.get() ?? EMPTY);

  return (
    <PassportView
      profile={profile}
      onEdit={() => router.push('/profile/edit')}
      onExport={() => exportPassportPdf(profile)}
    />
  );
}
