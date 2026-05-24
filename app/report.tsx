import { useMemo } from 'react';
import { Alert, View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ReportForm } from '../src/screens/ReportForm';
import { loadComplaintTemplates } from '../src/incidents/templates';
import { loadBundledOperators } from '../src/content/operators';
import { getIncidentStore } from '../src/incidents/factory';
import { GlassSurface } from '../src/components/GlassSurface';

export default function ReportRoute() {
  const router = useRouter();
  const operators = useMemo(() => loadBundledOperators(), []);
  const templates = useMemo(() => loadComplaintTemplates(), []);
  const store = useMemo(() => getIncidentStore(), []);

  const form = (
    <ReportForm
      operators={operators}
      templates={templates}
      transparent={Platform.OS === 'ios'}
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

  if (Platform.OS === 'ios') {
    return (
      <GlassSurface tint="sheet" cornerRadius={24} style={styles.sheet}>
        <View style={styles.sheetInner}>{form}</View>
      </GlassSurface>
    );
  }
  return form;
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  sheetInner: { flex: 1, backgroundColor: 'transparent' },
});
