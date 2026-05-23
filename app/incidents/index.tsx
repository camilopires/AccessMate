import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getIncidentStore } from '../../src/incidents/factory';
import type { Incident } from '../../src/incidents/schemas';

export default function IncidentsListScreen() {
  const router = useRouter();
  const store = useMemo(() => getIncidentStore(), []);
  const [incidents] = useState<Incident[]>(() => store.listAll());

  const visible = incidents.filter((i) => i.status !== 'discarded');

  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">
        Recent incidents
      </Text>
      {visible.length === 0 ? (
        <Text style={styles.empty}>No incidents recorded yet.</Text>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.summary ?? 'Untitled incident'} on ${item.startedAtISO.slice(0, 10)}`}
              onPress={() => router.push({ pathname: '/incidents/[id]', params: { id: item.id } })}
              style={styles.row}
            >
              <Text style={styles.rowTitle}>{item.summary ?? 'Untitled incident'}</Text>
              <Text style={styles.rowMeta}>
                {item.startedAtISO.slice(0, 10)} · {item.status}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, backgroundColor: '#fff' },
  h1: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 16 },
  empty: { fontSize: 18, color: '#444' },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  rowMeta: { fontSize: 14, color: '#444', marginTop: 4 },
});
