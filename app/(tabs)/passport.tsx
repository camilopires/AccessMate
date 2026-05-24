import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { PassportView } from '../../src/profile/PassportView';
import { getProfileStore } from '../../src/profile/store';
import { exportPassportPdf } from '../../src/profile/pdf';
import type { Profile } from '../../src/profile/schemas';

const EMPTY: Profile = { emergencyContacts: [] };

export default function ProfileScreen() {
  const router = useRouter();
  const store = useMemo(() => getProfileStore(), []);
  const [profile] = useState<Profile>(() => store.get() ?? EMPTY);

  return (
    <PassportView
      profile={profile}
      onEdit={() => router.push('/profile/edit')}
      onExport={() => exportPassportPdf(profile)}
    />
  );
}
