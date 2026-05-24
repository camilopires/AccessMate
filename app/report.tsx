import { Text } from 'react-native';
import { AppShell } from '../src/components/AppShell';
import { AppHeader } from '../src/components/AppHeader';

export default function ReportRoute() {
  return (
    <AppShell>
      <AppHeader title="Report" overline="Tell us what happened" />
      <Text>Coming online in Tasks D1–D4.</Text>
    </AppShell>
  );
}
