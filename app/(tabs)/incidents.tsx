import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { IncidentsListScreen } from '../../src/screens/IncidentsListScreen';
import { getIncidentStore } from '../../src/incidents/factory';

export default function IncidentsTab() {
  const router = useRouter();
  const store = useMemo(() => getIncidentStore(), []);
  const [incidents] = useState(() =>
    store.listAll().filter((i) => i.status !== 'discarded')
  );

  return (
    <IncidentsListScreen
      incidents={incidents}
      onNewReport={() => router.push('/report')}
      onOpenIncident={(id) => router.push({ pathname: '/incidents/[id]', params: { id } })}
    />
  );
}
