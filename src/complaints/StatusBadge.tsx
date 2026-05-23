import { View, Text, StyleSheet } from 'react-native';
import type { ComplaintStatus } from './complaint-schemas';

interface Props {
  status: ComplaintStatus;
}

const COLORS: Record<ComplaintStatus, { bg: string; text: string }> = {
  draft: { bg: '#e9ecef', text: '#212529' },
  sent: { bg: '#cfe2ff', text: '#084298' },
  acknowledged: { bg: '#fff3cd', text: '#664d03' },
  resolved: { bg: '#d1e7dd', text: '#0f5132' },
  escalated: { bg: '#f8d7da', text: '#842029' },
};

const LABELS: Record<ComplaintStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  escalated: 'Escalated',
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  text: { fontSize: 14, fontWeight: '600' },
});
