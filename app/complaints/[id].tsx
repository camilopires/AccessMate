import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';
import { BigActionButton } from '../../src/components/BigActionButton';
import { SectionLabel } from '../../src/components/SectionLabel';
import { StatusBadge } from '../../src/complaints/StatusBadge';
import { getComplaintStore } from '../../src/complaints/factory';
import { getComplaintTemplate } from '../../src/complaints/templates';
import { scheduleEightWeekReminder, cancelReminder } from '../../src/complaints/reminders';
import { colors, radius, space, type } from '../../src/theme';
import type { Complaint } from '../../src/complaints/complaint-schemas';

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useMemo(() => getComplaintStore(), []);
  const [complaint, setComplaint] = useState<Complaint | null>(() => (id ? store.get(id) : null));
  const [responseText, setResponseText] = useState(complaint?.responseMarkdown ?? '');

  if (!complaint) {
    return (
      <AppShell>
        <AppHeader title="Not found" overline="Complaint" />
        <Text style={styles.body}>This complaint has been removed or never existed.</Text>
      </AppShell>
    );
  }

  const tpl = getComplaintTemplate(complaint.templateId);
  const refresh = () => setComplaint(store.get(complaint.id));

  const onMarkSent = async () => {
    store.markSent(complaint.id);
    refresh();
    try {
      const rid = await scheduleEightWeekReminder({
        complaintId: complaint.id,
        title: 'Time to escalate?',
        body: 'It has been 8 weeks since you sent your complaint.',
      });
      if (rid) store.setReminderId(complaint.id, rid);
      refresh();
    } catch (e) {
      Alert.alert('Reminder not scheduled', e instanceof Error ? e.message : 'Unknown error');
    }
  };
  const onMarkAcknowledged = () => {
    store.markAcknowledged(complaint.id);
    refresh();
  };
  const onMarkResolved = async () => {
    if (complaint.reminderId) await cancelReminder(complaint.reminderId).catch(() => {});
    store.markResolved(complaint.id);
    store.setReminderId(complaint.id, null);
    refresh();
  };
  const onMarkEscalated = async () => {
    if (complaint.reminderId) await cancelReminder(complaint.reminderId).catch(() => {});
    store.markEscalated(complaint.id);
    store.setReminderId(complaint.id, null);
    refresh();
  };
  const onSaveResponse = () => {
    store.setResponse(complaint.id, responseText);
    refresh();
  };

  return (
    <AppShell>
      <AppHeader title={tpl?.title ?? complaint.templateId} overline="Complaint" />

      <View style={styles.statusRow}>
        <StatusBadge status={complaint.status} />
        <Text style={styles.meta}>Created {complaint.createdAtISO.slice(0, 10)}</Text>
      </View>

      <View style={styles.metaList}>
        {complaint.recipient && <Text style={styles.meta}>Sent to · {complaint.recipient}</Text>}
        {complaint.sentAtISO && (
          <Text style={styles.meta}>Sent · {complaint.sentAtISO.slice(0, 10)}</Text>
        )}
        {complaint.acknowledgedAtISO && (
          <Text style={styles.meta}>Acknowledged · {complaint.acknowledgedAtISO.slice(0, 10)}</Text>
        )}
        {complaint.resolvedAtISO && (
          <Text style={styles.meta}>Resolved · {complaint.resolvedAtISO.slice(0, 10)}</Text>
        )}
        {complaint.escalatedAtISO && (
          <Text style={styles.meta}>Escalated · {complaint.escalatedAtISO.slice(0, 10)}</Text>
        )}
      </View>

      <SectionLabel>Update status</SectionLabel>
      <View style={styles.actions}>
        {complaint.status === 'draft' && (
          <BigActionButton label="Mark as sent" hint="Set status to Sent" onPress={onMarkSent} />
        )}
        {complaint.status === 'sent' && (
          <>
            <BigActionButton
              label="Mark as acknowledged"
              hint="The operator has acknowledged"
              onPress={onMarkAcknowledged}
            />
            <BigActionButton
              label="Escalate"
              hint="Move to escalated status"
              variant="secondary"
              onPress={onMarkEscalated}
            />
          </>
        )}
        {complaint.status === 'acknowledged' && (
          <>
            <BigActionButton
              label="Mark resolved"
              hint="The matter is resolved"
              onPress={onMarkResolved}
            />
            <BigActionButton
              label="Escalate"
              hint="Move to escalated status"
              variant="secondary"
              onPress={onMarkEscalated}
            />
          </>
        )}
      </View>

      <SectionLabel>Operator response</SectionLabel>
      <TextInput
        value={responseText}
        onChangeText={setResponseText}
        placeholder="Paste the operator's reply here"
        placeholderTextColor={colors.ink.soft}
        accessibilityLabel="Operator response text"
        multiline
        style={styles.input}
      />
      <BigActionButton
        label="Save response"
        hint="Save the operator's reply"
        variant="secondary"
        onPress={onSaveResponse}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body, color: colors.ink.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  metaList: { gap: 2 },
  meta: { ...type.caption, color: colors.ink.muted },
  actions: { gap: space.sm },
  input: {
    ...type.body,
    borderWidth: 1,
    borderColor: colors.line.hairline,
    backgroundColor: colors.bg.raised,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
    minHeight: 120,
    color: colors.ink.primary,
    textAlignVertical: 'top',
  },
});
