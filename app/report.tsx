import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ReportForm } from '../src/screens/ReportForm';
import { loadComplaintTemplates } from '../src/incidents/templates';
import { loadBundledOperators } from '../src/content/operators';
import { getIncidentStore } from '../src/incidents/factory';

export default function ReportRoute() {
  const router = useRouter();
  const operators = useMemo(() => loadBundledOperators(), []);
  const templates = useMemo(() => loadComplaintTemplates(), []);
  const store = useMemo(() => getIncidentStore(), []);

  return (
    <ReportForm
      operators={operators}
      templates={templates}
      onCancel={() => router.back()}
      onComplete={(draft) => {
        try {
          const incident = store.saveDraft({
            title: draft.title,
            operatorId: draft.operatorId,
            facts: draft.facts,
            templateId: draft.templateId,
            draftBody: draft.draftBody,
            recipient: draft.recipient,
          });
          router.replace({ pathname: '/incidents/[id]', params: { id: incident.id } });
        } catch (e) {
          Alert.alert('Could not save draft', e instanceof Error ? e.message : 'Unknown error');
        }
      }}
    />
  );
}
