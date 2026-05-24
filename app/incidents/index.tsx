import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';
import { DestinationCard } from '../../src/components/DestinationCard';
import { getIncidentStore } from '../../src/incidents/factory';
import { colors, space, type } from '../../src/theme';
import type { Incident } from '../../src/incidents/schemas';

export default function IncidentsListScreen() {
  const router = useRouter();
  const store = useMemo(() => getIncidentStore(), []);
  const [incidents] = useState<Incident[]>(() => store.listAll());

  const visible = incidents.filter((i) => i.status !== 'discarded');

  return (
    <AppShell>
      <AppHeader
        title="Recent incidents"
        overline="Captured"
        subtitle={`${visible.length} ${visible.length === 1 ? 'entry' : 'entries'} on this device`}
      />
      {visible.length === 0 ? (
        <Text style={styles.empty}>No incidents recorded yet.</Text>
      ) : (
        <View>
          {visible.map((item) => (
            <DestinationCard
              key={item.id}
              title={item.summary ?? 'Untitled incident'}
              caption={`${item.startedAtISO.slice(0, 10)} · ${item.status}`}
              onPress={() => router.push({ pathname: '/incidents/[id]', params: { id: item.id } })}
            />
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  empty: { ...type.body, color: colors.ink.muted },
});
