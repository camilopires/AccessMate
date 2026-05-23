import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BigActionButton } from '../../src/components/BigActionButton';
import { StatusBadge } from '../../src/complaints/StatusBadge';
import { getComplaintStore } from '../../src/complaints/factory';
import { getComplaintTemplate } from '../../src/complaints/templates';
import { scheduleEightWeekReminder, cancelReminder } from '../../src/complaints/reminders';
import type { Complaint } from '../../src/complaints/complaint-schemas';

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useMemo(() => getComplaintStore(), []);
  const [complaint, setComplaint] = useState<Complaint | null>(() => (id ? store.get(id) : null));
  const [responseText, setResponseText] = useState(complaint?.responseMarkdown ?? '');

  if (!complaint) {
    return (
      <View style={styles.root}>
        <Text style={styles.h1} accessibilityRole="header">
          Not found
        </Text>
      </View>
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
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        {tpl?.title ?? complaint.templateId}
      </Text>
      <View style={styles.metaRow}>
        <StatusBadge status={complaint.status} />
        <Text style={styles.meta}>Created {complaint.createdAtISO.slice(0, 10)}</Text>
      </View>

      {complaint.recipient && <Text style={styles.meta}>Sent to: {complaint.recipient}</Text>}
      {complaint.sentAtISO && (
        <Text style={styles.meta}>Sent: {complaint.sentAtISO.slice(0, 10)}</Text>
      )}
      {complaint.acknowledgedAtISO && (
        <Text style={styles.meta}>Acknowledged: {complaint.acknowledgedAtISO.slice(0, 10)}</Text>
      )}
      {complaint.resolvedAtISO && (
        <Text style={styles.meta}>Resolved: {complaint.resolvedAtISO.slice(0, 10)}</Text>
      )}
      {complaint.escalatedAtISO && (
        <Text style={styles.meta}>Escalated: {complaint.escalatedAtISO.slice(0, 10)}</Text>
      )}

      <Text style={styles.h2} accessibilityRole="header">
        Update status
      </Text>
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
            onPress={onMarkEscalated}
          />
        </>
      )}

      <Text style={styles.h2} accessibilityRole="header">
        Operator response
      </Text>
      <TextInput
        value={responseText}
        onChangeText={setResponseText}
        placeholder="Paste the operator's reply here"
        accessibilityLabel="Operator response text"
        multiline
        style={styles.input}
      />
      <BigActionButton
        label="Save response"
        hint="Save the operator's reply"
        onPress={onSaveResponse}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, backgroundColor: '#fff', gap: 10 },
  root: { flex: 1, padding: 20, backgroundColor: '#fff' },
  h1: { fontSize: 26, fontWeight: '700', color: '#000' },
  h2: { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 6 },
  meta: { fontSize: 16, color: '#444' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  input: {
    borderWidth: 2,
    borderColor: '#1f6feb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 140,
    color: '#000',
    textAlignVertical: 'top',
  },
});
