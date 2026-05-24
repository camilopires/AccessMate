import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, space, type } from '../theme';
import type { ComplaintStatus } from './complaint-schemas';

interface Props {
  status: ComplaintStatus;
}

const LABELS: Record<ComplaintStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  escalated: 'Escalated',
};

export function StatusBadge({ status }: Props) {
  const c = colors.status[status];
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
