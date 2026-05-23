import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IncidentCaptureScreen } from '../../src/incidents/IncidentCaptureScreen';
import { getIncidentStore } from '../../src/incidents/factory';
import type { Incident } from '../../src/incidents/schemas';

export default function IncidentCaptureRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = useMemo(() => getIncidentStore(), []);
  const [incident] = useState<Incident>(() => {
    if (id) {
      const existing = store.get(id);
      if (existing && existing.status === 'in_progress') return existing;
    }
    return store.start({});
  });
  const [mediaCount, setMediaCount] = useState(() => store.mediaFor(incident.id).length);

  const finish = () => router.replace('/');

  return (
    <IncidentCaptureScreen
      incidentId={incident.id}
      mediaCount={mediaCount}
      onAttachNote={(text) => {
        store.attachMedia(incident.id, { kind: 'note', textBody: text });
        setMediaCount((n) => n + 1);
      }}
      onTakePhoto={() => {
        Alert.alert('Photo capture', 'Photo capture lands in a later phase.');
      }}
      onRecordAudio={() => {
        Alert.alert('Audio capture', 'Audio capture lands in a later phase.');
      }}
      onSave={(summary) => {
        store.markComplete(incident.id, summary || undefined);
        finish();
      }}
      onDiscard={() => {
        store.discard(incident.id);
        finish();
      }}
    />
  );
}
