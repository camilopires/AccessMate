import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';
import { BigActionButton } from '../../src/components/BigActionButton';
import { SectionLabel } from '../../src/components/SectionLabel';
import { getIncidentStore } from '../../src/incidents/factory';
import { colors, space, type } from '../../src/theme';
import type { Incident, MediaRef } from '../../src/incidents/schemas';

export default function IncidentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useMemo(() => getIncidentStore(), []);
  const [incident] = useState<Incident | null>(() => (id ? store.get(id) : null));
  const [media] = useState<MediaRef[]>(() => (id ? store.mediaFor(id) : []));

  if (!incident) {
    return (
      <AppShell>
        <AppHeader title="Not found" overline="Incident" />
        <Text style={styles.body}>This incident has been removed or never existed.</Text>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader
        title={incident.summary ?? 'Untitled incident'}
        overline={`${incident.startedAtISO.slice(0, 10)} · ${incident.status}`}
      />

      <View style={styles.metaList}>
        {incident.location?.label && (
          <Text style={styles.meta}>Location · {incident.location.label}</Text>
        )}
        {incident.operatorId && <Text style={styles.meta}>Operator · {incident.operatorId}</Text>}
      </View>

      <SectionLabel>Captured</SectionLabel>
      {media.length === 0 ? (
        <Text style={styles.body}>No items captured.</Text>
      ) : (
        <View style={styles.list}>
          {media.map((m) => (
            <Text key={m.id} style={styles.body}>
              · {m.kind === 'note' ? m.textBody : `${m.kind} attached`}
            </Text>
          ))}
        </View>
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
          variant="secondary"
          onPress={() => router.push({ pathname: '/share', params: { incidentId: incident.id } })}
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metaList: { gap: 2 },
  meta: { ...type.caption, color: colors.ink.muted },
  body: { ...type.body, color: colors.ink.primary },
  list: { gap: space.xs },
  actions: { marginTop: space.xl, gap: space.sm },
});
