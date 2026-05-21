import { View, Text, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BigActionButton } from '../../src/components/BigActionButton';
import { loadBundledOperators } from '../../src/content/operators';

export default function OperatorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const operator = loadBundledOperators().find((o) => o.id === id);
  if (!operator) return <Text style={styles.padded}>Operator not found.</Text>;

  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">
        {operator.name}
      </Text>
      <Text style={styles.mode}>{operator.mode.toUpperCase()}</Text>
      <BigActionButton
        label="Call Passenger Assistance"
        hint={operator.assistance.phone}
        onPress={() => Linking.openURL(`tel:${operator.assistance.phone}`)}
      />
      {operator.complaintsRoute.primaryEmail && (
        <BigActionButton
          label="Email complaints team"
          hint={operator.complaintsRoute.primaryEmail}
          onPress={() => Linking.openURL(`mailto:${operator.complaintsRoute.primaryEmail}`)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 60, gap: 20, backgroundColor: '#fff' },
  padded: { padding: 24 },
  h1: { fontSize: 28, fontWeight: '700' },
  mode: { fontSize: 12, color: '#57606a', letterSpacing: 1 },
});
