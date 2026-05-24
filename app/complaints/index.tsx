import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';
import { getComplaintStore } from '../../src/complaints/factory';
import { StatusBadge } from '../../src/complaints/StatusBadge';
import { getComplaintTemplate } from '../../src/complaints/templates';
import { colors, minTapTarget, space, type } from '../../src/theme';
import type { Complaint } from '../../src/complaints/complaint-schemas';

export default function ComplaintsListScreen() {
  const router = useRouter();
  const store = useMemo(() => getComplaintStore(), []);
  const [complaints] = useState<Complaint[]>(() => store.listAll());

  return (
    <AppShell>
      <AppHeader
        title="Complaints"
        overline="Filed"
        subtitle={`${complaints.length} ${complaints.length === 1 ? 'complaint' : 'complaints'} on file`}
      />
      {complaints.length === 0 ? (
        <Text style={styles.empty}>No complaints filed yet.</Text>
      ) : (
        <View>
          {complaints.map((item) => {
            const tpl = getComplaintTemplate(item.templateId);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${tpl?.title ?? item.templateId} — ${item.status}`}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() =>
                  router.push({ pathname: '/complaints/[id]', params: { id: item.id } })
                }
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{tpl?.title ?? item.templateId}</Text>
                  <Text style={styles.rowMeta}>{item.createdAtISO.slice(0, 10)}</Text>
                </View>
                <StatusBadge status={item.status} />
              </Pressable>
            );
          })}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  empty: { ...type.body, color: colors.ink.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTapTarget,
    paddingVertical: space.base,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line.hairline,
    gap: space.md,
  },
  rowPressed: { backgroundColor: colors.bg.sunken },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...type.action, color: colors.ink.primary },
  rowMeta: { ...type.caption, color: colors.ink.muted },
});
