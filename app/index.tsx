import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { AppShell } from '../src/components/AppShell';
import { AppHeader } from '../src/components/AppHeader';
import { DestinationCard } from '../src/components/DestinationCard';
import { EmergencyCard } from '../src/components/EmergencyCard';
import { AlertCard } from '../src/components/AlertCard';
import { SectionLabel } from '../src/components/SectionLabel';
import { getIncidentStore } from '../src/incidents/factory';
import { getSettingsStore } from '../src/settings/factory';
import { space } from '../src/theme';

const TODAY_LABEL = new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function HomeScreen() {
  const router = useRouter();
  const incidents = useMemo(() => getIncidentStore(), []);
  const settings = useMemo(() => getSettingsStore(), []);
  const [inProgress] = useState(() => incidents.listInProgress());
  const [onboardingComplete] = useState(() => settings.get().onboardingComplete);

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  const onResume = () => {
    const latest = inProgress[inProgress.length - 1];
    if (latest) router.push({ pathname: '/incident/capture', params: { id: latest.id } });
  };

  return (
    <AppShell back={false}>
      <AppHeader title="AccessMate" overline={TODAY_LABEL} />

      {inProgress.length > 0 && (
        <AlertCard
          title={`${inProgress.length} incident${inProgress.length === 1 ? '' : 's'} in progress`}
          caption="Pick up where you left off."
          actionLabel="Resume capture"
          onPress={onResume}
        />
      )}

      <View style={styles.list}>
        <SectionLabel>Travelling</SectionLabel>
        <DestinationCard
          index="01"
          title="Plan a trip"
          caption="Browse operator contacts and accessibility info"
          onPress={() => router.push('/directory')}
        />
        <DestinationCard
          index="02"
          title="Your accessibility passport"
          caption="Show staff the access profile you've set up"
          onPress={() => router.push('/profile')}
        />

        <SectionLabel>If something happens</SectionLabel>
        <DestinationCard
          index="03"
          title="Recent incidents"
          caption="Review what you've captured"
          onPress={() => router.push('/incidents')}
        />
        <DestinationCard
          index="04"
          title="Complaints"
          caption="Track what you've filed and what's overdue"
          onPress={() => router.push('/complaints')}
        />

        <SectionLabel>Setup</SectionLabel>
        <DestinationCard
          index="05"
          title="Settings"
          caption="App preferences, your data, and AI options"
          onPress={() => router.push('/settings')}
        />
        <DestinationCard title="I'm travelling now" caption="Coming soon" onPress={() => {}} />
      </View>

      <EmergencyCard
        title="Something went wrong"
        caption="Start capturing what's happening, right now."
        onPress={() => router.push('/incident/capture')}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: space.sm },
});
