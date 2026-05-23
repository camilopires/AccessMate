import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BigActionButton } from '../../src/components/BigActionButton';
import { getIncidentStore } from '../../src/incidents/factory';
import type { Incident, MediaRef } from '../../src/incidents/schemas';

export default function IncidentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useMemo(() => getIncidentStore(), []);
  const [incident] = useState<Incident | null>(() => (id ? store.get(id) : null));
  const [media] = useState<MediaRef[]>(() => (id ? store.mediaFor(id) : []));

  if (!incident) {
    return (
      <View style={styles.root}>
        <Text style={styles.h1} accessibilityRole="header">
          Not found
        </Text>
        <Text>This incident has been removed or never existed.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        {incident.summary ?? 'Untitled incident'}
      </Text>
      <Text style={styles.meta}>
        {incident.startedAtISO.slice(0, 10)} · {incident.status}
      </Text>
      {incident.location?.label && (
        <Text style={styles.meta}>Location: {incident.location.label}</Text>
      )}
      {incident.operatorId && <Text style={styles.meta}>Operator: {incident.operatorId}</Text>}

      <Text style={styles.h2} accessibilityRole="header">
        Captured
      </Text>
      {media.length === 0 ? (
        <Text style={styles.body}>No items captured.</Text>
      ) : (
        media.map((m) => (
          <Text key={m.id} style={styles.body}>
            • {m.kind === 'note' ? m.textBody : `${m.kind} attached`}
          </Text>
        ))
      )}

      <View style={styles.actions}>
        <BigActionButton
          label="Compose complaint"
          hint="Open the complaint composer with this incident's facts"
          onPress={() => router.push({ pathname: '/compose', params: { incidentId: incident.id } })}
        />
        <BigActionButton
          label="Share publicly"
          hint="Compose a redacted post for X / Bluesky / Threads / Instagram"
          onPress={() => router.push({ pathname: '/share', params: { incidentId: incident.id } })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, backgroundColor: '#fff', gap: 6 },
  root: { flex: 1, padding: 20, backgroundColor: '#fff' },
  h1: { fontSize: 26, fontWeight: '700', color: '#000', marginBottom: 4 },
  h2: { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 8 },
  meta: { fontSize: 16, color: '#444' },
  body: { fontSize: 16, color: '#000', marginVertical: 2 },
  actions: { marginTop: 24, gap: 12 },
});
