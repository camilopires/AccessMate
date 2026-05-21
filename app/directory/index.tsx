import { FlatList, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { loadBundledOperators } from '../../src/content/operators';

export default function DirectoryScreen() {
  const router = useRouter();
  const operators = loadBundledOperators();
  return (
    <FlatList
      data={operators}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/directory/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.mode}`}
          style={styles.row}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.mode}>{item.mode.toUpperCase()}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, gap: 12 },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    backgroundColor: '#fff',
  },
  name: { fontSize: 18, fontWeight: '600' },
  mode: { marginTop: 4, fontSize: 12, color: '#57606a', letterSpacing: 1 },
});
