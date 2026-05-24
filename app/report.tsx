import { useEffect, useMemo, useState } from 'react';
import { Alert, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ReportForm } from '../src/screens/ReportForm';
import { ConversationalReportScreen } from '../src/screens/ConversationalReportScreen';
import { loadComplaintTemplates } from '../src/incidents/templates';
import { loadBundledOperators } from '../src/content/operators';
import { getIncidentStore } from '../src/incidents/factory';
import { getSettingsStore } from '../src/settings/factory';
import { GlassSurface } from '../src/components/GlassSurface';
import { chooseFlow, type ReportFlow } from '../src/ai/conversation';
import type {
  AppleFmIncidentFactsPayload,
  AppleFmNativeModule,
} from '../modules/apple-fm/src/AppleFm.types';
import { colors } from '../src/theme';

// Conditional dynamic load — keeps web bundles free of the native module
// and avoids tsc trying to compile the excluded native entry point.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppleFm = require('../modules/apple-fm/src').default as AppleFmNativeModule;

export default function ReportRoute() {
  const router = useRouter();
  const operators = useMemo(() => loadBundledOperators(), []);
  const templates = useMemo(() => loadComplaintTemplates(), []);
  const store = useMemo(() => getIncidentStore(), []);
  const settings = useMemo(() => getSettingsStore(), []);

  const [flow, setFlow] = useState<ReportFlow | 'pending'>('pending');
  const [carriedFacts, setCarriedFacts] = useState<AppleFmIncidentFactsPayload>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const decided = await chooseFlow({
        platform: Platform.OS as 'ios' | 'android' | 'web' | 'macos' | 'windows',
        aiProvider: settings.get().aiProvider,
        isAppleFmAvailable: () => AppleFm.isAvailable(),
      });
      if (alive) setFlow(decided);
    })();
    return () => {
      alive = false;
    };
  }, [settings]);

  const onDraftReady = (draft: Parameters<typeof store.saveDraft>[0]) => {
    try {
      const incident = store.saveDraft(draft);
      router.replace({ pathname: '/incidents/[id]', params: { id: incident.id } });
    } catch (e) {
      Alert.alert('Could not save draft', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  let content: React.ReactNode;
  if (flow === 'pending') {
    content = (
      <View style={styles.pending}>
        <ActivityIndicator color={colors.accent.deep} />
      </View>
    );
  } else if (flow === 'conversational') {
    content = (
      <ConversationalReportScreen
        operators={operators}
        templates={templates}
        transparent={Platform.OS === 'ios'}
        startConversation={(sys) => AppleFm.startConversation(sys)}
        sendMessage={(id, text) => AppleFm.sendMessage(id, text)}
        endConversation={(id) => AppleFm.endConversation(id)}
        onComplete={onDraftReady}
        onSwitchToForm={(facts) => {
          setCarriedFacts(facts);
          setFlow('template');
        }}
      />
    );
  } else {
    content = (
      <ReportForm
        operators={operators}
        templates={templates}
        transparent={Platform.OS === 'ios'}
        initialOperatorName={carriedFacts.operatorName ?? undefined}
        initialScenarioId={carriedFacts.scenarioId ?? undefined}
        initialAccompanied={carriedFacts.accompanied ?? undefined}
        onCancel={() => router.back()}
        onComplete={onDraftReady}
      />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <GlassSurface tint="sheet" cornerRadius={24} style={styles.sheet}>
        <View style={styles.sheetInner}>{content}</View>
      </GlassSurface>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  sheetInner: { flex: 1, backgroundColor: 'transparent' },
  pending: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
