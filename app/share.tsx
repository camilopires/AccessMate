import { useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ShareComposerScreen } from '../src/share/ShareComposerScreen';
import { shareDeepLink } from '../src/share/deep-links';
import { getIncidentStore } from '../src/incidents/factory';
import { loadBundledOperators } from '../src/content/operators';
import { copyComplaint } from '../src/complaints/outputs';

export default function ShareRoute() {
  const { incidentId } = useLocalSearchParams<{ incidentId?: string }>();
  const incidentStore = useMemo(() => getIncidentStore(), []);
  const operators = useMemo(() => loadBundledOperators(), []);

  const incident = incidentId ? incidentStore.get(incidentId) : null;
  const operator = incident?.operatorId
    ? operators.find((o) => o.id === incident.operatorId)
    : undefined;

  const initialText = incident?.summary
    ? `${incident.summary} — ${incident.startedAtISO.slice(0, 10)}`
    : 'Sharing my experience.';

  return (
    <ShareComposerScreen
      initialText={initialText}
      operatorName={operator?.name}
      onOpenShare={(platform, text) => {
        const url = shareDeepLink(platform, text);
        if (!url) {
          copyComplaint(text)
            .then(() => Alert.alert('Copied', 'Paste this into your post.'))
            .catch(() => Alert.alert('Could not copy', 'Clipboard access failed.'));
          return;
        }
        Linking.openURL(url).catch(() =>
          Alert.alert('Could not open', `Open this link manually: ${url}`),
        );
      }}
    />
  );
}
