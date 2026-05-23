import { useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BigActionButton } from '../src/components/BigActionButton';
import { ResumeBanner } from '../src/incidents/ResumeBanner';
import { getIncidentStore } from '../src/incidents/factory';

export default function HomeScreen() {
  const router = useRouter();
  const store = useMemo(() => getIncidentStore(), []);
  const [inProgress] = useState(() => store.listInProgress());

  const onResume = () => {
    const latest = inProgress[inProgress.length - 1];
    if (latest) router.push({ pathname: '/incident/capture', params: { id: latest.id } });
  };

  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">
        AccessMate
      </Text>
      <ResumeBanner count={inProgress.length} onResume={onResume} />
      <View style={styles.actions}>
        <BigActionButton
          label="Plan a trip"
          hint="Browse operator contacts"
          onPress={() => router.push('/directory')}
        />
        <BigActionButton
          label="Your accessibility passport"
          hint="Show the profile you can share with staff"
          onPress={() => router.push('/profile')}
        />
        <BigActionButton
          label="Recent incidents"
          hint="Review what you've captured"
          onPress={() => router.push('/incidents')}
        />
        <BigActionButton
          label="Complaints"
          hint="Track your filed complaints"
          onPress={() => router.push('/complaints')}
        />
        <BigActionButton
          label="Settings"
          hint="App preferences and your data"
          onPress={() => router.push('/settings')}
        />
        <BigActionButton label="I'm travelling now" hint="Coming soon" onPress={() => {}} />
        <BigActionButton
          label="Something went wrong"
          hint="Start capturing an incident"
          onPress={() => router.push('/incident/capture')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 80, gap: 28, backgroundColor: '#fff' },
  h1: { fontSize: 32, fontWeight: '700' },
  actions: { gap: 16 },
});
