import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, space, type } from '../theme';
import type { IncidentStatus } from './schemas';

interface Props {
  status: IncidentStatus;
}

const LABELS: Record<IncidentStatus, string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  completed: 'Completed',
  discarded: 'Discarded',
};

const COLORS: Record<IncidentStatus, { bg: string; text: string }> = {
  draft: colors.status.draft,
  in_progress: colors.status.sent,
  completed: colors.status.resolved,
  discarded: colors.status.draft,
};

export function StatusBadge({ status }: Props) {
  const c = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]} accessibilityRole="text">
      <Text style={[styles.text, { color: c.text }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { ...type.label, letterSpacing: 1 },
});
