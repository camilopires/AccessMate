import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';
import { DestinationCard } from '../../src/components/DestinationCard';
import { loadBundledOperators } from '../../src/content/operators';

export default function DirectoryScreen() {
  const router = useRouter();
  const operators = loadBundledOperators();
  return (
    <AppShell>
      <AppHeader
        title="Operators"
        overline="Plan a trip"
        subtitle={`${operators.length} bundled operator${operators.length === 1 ? '' : 's'}. More via OTA later.`}
      />
      <View>
        {operators.map((item) => (
          <DestinationCard
            key={item.id}
            title={item.name}
            caption={item.mode.toUpperCase()}
            onPress={() => router.push(`/directory/${item.id}`)}
          />
        ))}
      </View>
    </AppShell>
  );
}
