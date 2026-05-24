import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileEditor } from '../../src/profile/ProfileEditor';
import { getProfileStore } from '../../src/profile/store';
import type { Profile } from '../../src/profile/schemas';

const EMPTY: Profile = { emergencyContacts: [] };

export default function ProfileEditScreen() {
  const router = useRouter();
  const store = useMemo(() => getProfileStore(), []);
  const [profile, setProfile] = useState<Profile>(() => store.get() ?? EMPTY);

  const onSave = () => {
    try {
      store.upsert(profile);
      router.replace('/(tabs)/passport');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return <ProfileEditor profile={profile} onChange={setProfile} onSave={onSave} />;
}
