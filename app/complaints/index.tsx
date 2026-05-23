import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getComplaintStore } from '../../src/complaints/factory';
import { StatusBadge } from '../../src/complaints/StatusBadge';
import { getComplaintTemplate } from '../../src/complaints/templates';
import type { Complaint } from '../../src/complaints/complaint-schemas';

export default function ComplaintsListScreen() {
  const router = useRouter();
  const store = useMemo(() => getComplaintStore(), []);
  const [complaints] = useState<Complaint[]>(() => store.listAll());

  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">
        Complaints
      </Text>
      {complaints.length === 0 ? (
        <Text style={styles.empty}>No complaints filed yet.</Text>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const tpl = getComplaintTemplate(item.templateId);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${tpl?.title ?? item.templateId} — ${item.status}`}
                style={styles.row}
                onPress={() =>
                  router.push({ pathname: '/complaints/[id]', params: { id: item.id } })
                }
              >
                <Text style={styles.rowTitle}>{tpl?.title ?? item.templateId}</Text>
                <Text style={styles.rowMeta}>{item.createdAtISO.slice(0, 10)}</Text>
                <View style={styles.badgeRow}>
                  <StatusBadge status={item.status} />
                </View>
              </Pressable>
            );
          }}
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
  rowMeta: { fontSize: 14, color: '#444', marginTop: 2 },
  badgeRow: { marginTop: 6 },
});
