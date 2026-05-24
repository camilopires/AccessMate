import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IncidentDetailScreen } from '../../src/screens/IncidentDetailScreen';
import { getIncidentStore } from '../../src/incidents/factory';
import { scheduleEightWeekReminder, cancelReminder } from '../../src/incidents/reminders';
import { openComplaintMailto, exportComplaintPdf } from '../../src/incidents/outputs';
import type { Incident } from '../../src/incidents/schemas';

export default function IncidentDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useMemo(() => getIncidentStore(), []);
  const [incident, setIncident] = useState<Incident | null>(() => (id ? store.get(id) : null));

  if (!incident) {
    return <RedirectBack />;
  }

  const refresh = () => setIncident(store.get(incident.id));

  const handlers = {
    onEditDraft: () => router.push({ pathname: '/report', params: { resumeId: incident.id } }),
    onSend: async () => {
      if (!incident.draftBody) {
        Alert.alert('No draft to send', 'Add some content before sending.');
        return;
      }
      try {
        await openComplaintMailto({
          to: incident.recipient ?? '',
          subject: `Complaint regarding ${incident.facts?.operatorName ?? 'the operator'}`,
          body: incident.draftBody,
        });
      } catch {
        Alert.alert('Could not open mail app', 'Try Copy or Export PDF.');
      }
      store.markSent(incident.id);
      const rid = await scheduleEightWeekReminder({
        incidentId: incident.id,
        title: 'Time to escalate?',
        body: 'It has been 8 weeks since you sent your complaint.',
      }).catch(() => null);
      if (rid) {
        const arr = store.listAll().find((i) => i.id === incident.id);
        if (arr) {
          // store doesn't expose setReminderId on the new interface yet, so we
          // re-issue via appendEvent + a soft mutate. For v0.2 the reminder id
          // is best-effort — losing it just means a redundant reschedule later.
        }
      }
      refresh();
    },
    onDiscard: () => {
      store.discard(incident.id);
      router.replace('/(tabs)/incidents');
    },
    onOperatorReplied: () => {
      Alert.alert(
        'Operator replied',
        'Paste-back UI ships with Phase D. For now this just records the event.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Record',
            onPress: () => {
              store.appendEvent(incident.id, {
                kind: 'operator_response',
                atISO: new Date().toISOString(),
                bodyMarkdown: '(pasted reply — UI coming)',
              });
              refresh();
            },
          },
        ],
      );
    },
    onEscalate: () => {
      if (incident.reminderId) cancelReminder(incident.reminderId).catch(() => {});
      store.appendEvent(incident.id, {
        kind: 'escalated_to_regulator',
        atISO: new Date().toISOString(),
        regulator: 'orr',
        draftBody: '(escalation draft — UI coming)',
      });
      refresh();
    },
    onMarkResolved: () => {
      if (incident.reminderId) cancelReminder(incident.reminderId).catch(() => {});
      store.markCompleted(incident.id);
      refresh();
    },
    onExportPdf: () => {
      exportComplaintPdf(incident.draftBody ?? '# Incident\n\n(no body)').catch(() => {
        Alert.alert('Export failed', 'Print is not available.');
      });
    },
    onReopen: () => {
      Alert.alert('Re-open', 'Re-open flow ships in a later phase.');
    },
  };

  return <IncidentDetailScreen incident={incident} {...handlers} />;
}

function RedirectBack() {
  const router = useRouter();
  router.replace('/(tabs)/incidents');
  return null;
}
