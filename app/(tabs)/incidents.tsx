import { Text } from 'react-native';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';

export default function IncidentsTab() {
  return (
    <AppShell>
      <AppHeader title="Incidents" overline="Today" />
      <Text>Coming online in Task B2.</Text>
    </AppShell>
  );
}
