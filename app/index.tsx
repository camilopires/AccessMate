import { View, Text, StyleSheet } from 'react-native';

export default function PlaceholderHome() {
  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">
        AccessMate
      </Text>
      <Text style={styles.body}>Phase 1 — Task 1.1 scaffold check.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, paddingTop: 80, backgroundColor: '#fff' },
  h1: { fontSize: 32, fontWeight: '700' },
  body: { marginTop: 8, fontSize: 16, color: '#555' },
});
