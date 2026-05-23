import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileEditor } from '../../src/profile/ProfileEditor';
import { ProfileRepository } from '../../src/profile/repository';
import { ExpoSqliteAdapter } from '../../src/db/sqlite-adapter';
import { getDatabase } from '../../src/db';
import type { Profile } from '../../src/profile/schemas';

const EMPTY: Profile = { emergencyContacts: [] };

export default function ProfileEditScreen() {
  const router = useRouter();
  const repo = useMemo(() => new ProfileRepository(new ExpoSqliteAdapter(getDatabase())), []);
  const [profile, setProfile] = useState<Profile>(() => repo.get() ?? EMPTY);

  const onSave = () => {
    try {
      repo.upsert(profile);
      router.replace('/profile');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return <ProfileEditor profile={profile} onChange={setProfile} onSave={onSave} />;
}
