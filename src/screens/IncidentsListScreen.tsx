import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { EmergencyCard } from '../components/EmergencyCard';
import { DestinationCard } from '../components/DestinationCard';
import { ProfileChip } from '../components/ProfileChip';
import { StatusBadge } from '../incidents/StatusBadge';
import { colors, space, type } from '../theme';
import type { Incident } from '../incidents/schemas';

type Filter = 'draft' | 'in_progress' | 'completed';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'draft', label: 'Drafts' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

const EMPTY: Record<Filter, string> = {
  draft: 'No drafts. Tap Start a new report to begin.',
  in_progress: 'No incidents in progress.',
  completed: 'No completed incidents yet.',
};

interface Props {
  incidents: Incident[];
  onNewReport: () => void;
  onOpenIncident: (id: string) => void;
}

export function IncidentsListScreen({ incidents, onNewReport, onOpenIncident }: Props) {
  const [filter, setFilter] = useState<Filter>('in_progress');
  const counts: Record<Filter, number> = {
    draft: incidents.filter((i) => i.status === 'draft').length,
    in_progress: incidents.filter((i) => i.status === 'in_progress').length,
    completed: incidents.filter((i) => i.status === 'completed').length,
  };
  const visible = incidents.filter((i) => i.status === filter);

  return (
    <AppShell>
      <AppHeader title="Incidents" overline="Today" />
      <EmergencyCard
        title="Start a new report"
        caption="Tell AccessMate what happened — we'll guide you through it."
        onPress={onNewReport}
      />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <ProfileChip
            key={f.id}
            label={`${f.label} (${counts[f.id]})`}
            selected={filter === f.id}
            onToggle={() => setFilter(f.id)}
          />
        ))}
      </View>
      {visible.length === 0 ? (
        <Text style={styles.empty}>{EMPTY[filter]}</Text>
      ) : (
        <View>
          {visible.map((item) => (
            <View key={item.id} style={styles.row}>
              <DestinationCard
                title={item.title ?? 'Untitled incident'}
                caption={`${item.startedAtISO.slice(0, 10)}${item.facts?.operatorName ? ` · ${item.facts.operatorName}` : ''}`}
                onPress={() => onOpenIncident(item.id)}
              />
              <View style={styles.badge} pointerEvents="none">
                <StatusBadge status={item.status} />
              </View>
            </View>
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.xs },
  empty: { ...type.body, color: colors.ink.muted },
  row: { position: 'relative' },
  badge: { position: 'absolute', right: space.lg, top: space.base },
});
