import { Text } from 'react-native';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';

export default function IncidentDetailRoute() {
  return (
    <AppShell>
      <AppHeader title="Incident" overline="Detail" />
      <Text>Coming online in Task C1.</Text>
    </AppShell>
  );
}
