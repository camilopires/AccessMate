import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BigActionButton } from '../src/components/BigActionButton';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">
        AccessMate
      </Text>
      <View style={styles.actions}>
        <BigActionButton
          label="Plan a trip"
          hint="Browse operator contacts"
          onPress={() => router.push('/directory')}
        />
        <BigActionButton
          label="Your accessibility passport"
          hint="Show the profile you can share with staff"
          onPress={() => router.push('/profile')}
        />
        <BigActionButton label="I'm travelling now" hint="Coming soon" onPress={() => {}} />
        <BigActionButton label="Something went wrong" hint="Coming soon" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 80, gap: 28, backgroundColor: '#fff' },
  h1: { fontSize: 32, fontWeight: '700' },
  actions: { gap: 16 },
});
