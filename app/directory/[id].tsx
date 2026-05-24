import { Linking, Alert, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';
import { BigActionButton } from '../../src/components/BigActionButton';
import { SectionLabel } from '../../src/components/SectionLabel';
import { loadBundledOperators } from '../../src/content/operators';
import { colors, space, type } from '../../src/theme';

function openOrAlert(url: string, friendly: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open', friendly);
  });
}

export default function OperatorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const operator = loadBundledOperators().find((o) => o.id === id);

  if (!operator) {
    return (
      <AppShell>
        <AppHeader title="Not found" overline="Directory" />
        <Text style={styles.body}>This operator has been removed or never existed.</Text>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader title={operator.name} overline={operator.mode.toUpperCase()} />

      <View style={styles.actions}>
        <BigActionButton
          label="Call Passenger Assistance"
          hint={operator.assistance.phone}
          onPress={() => openOrAlert(`tel:${operator.assistance.phone}`, operator.assistance.phone)}
        />
        {operator.complaintsRoute.primaryEmail && (
          <BigActionButton
            label="Email complaints team"
            hint={operator.complaintsRoute.primaryEmail}
            variant="secondary"
            onPress={() =>
              openOrAlert(
                `mailto:${operator.complaintsRoute.primaryEmail}`,
                operator.complaintsRoute.primaryEmail!,
              )
            }
          />
        )}
      </View>

      <SectionLabel>Details</SectionLabel>
      <View style={styles.kvList}>
        <KV label="Assistance phone" value={operator.assistance.phone} />
        {operator.assistance.bookingUrl && (
          <KV label="Booking" value={operator.assistance.bookingUrl} />
        )}
        {operator.complaintsRoute.primaryEmail && (
          <KV label="Complaints email" value={operator.complaintsRoute.primaryEmail} />
        )}
        <KV label="Regulator" value={operator.complaintsRoute.regulator.toUpperCase()} />
        <KV label="Verified" value={operator.lastVerifiedUTC.slice(0, 10)} />
      </View>
    </AppShell>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body, color: colors.ink.primary },
  actions: { gap: space.sm },
  kvList: { gap: space.sm },
  kv: {
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line.hairline,
  },
  kvLabel: { ...type.label, color: colors.ink.muted },
  kvValue: { ...type.bodyEmphasis, color: colors.ink.primary, marginTop: 2 },
});
