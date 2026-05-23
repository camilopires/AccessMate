import { View, Text, StyleSheet } from 'react-native';
import { BigActionButton } from '../components/BigActionButton';

interface Props {
  count: number;
  onResume: () => void;
}

export function ResumeBanner({ count, onResume }: Props) {
  if (count <= 0) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.label}>
        {count} incident{count === 1 ? '' : 's'} in progress
      </Text>
      <BigActionButton
        label={count === 1 ? 'Resume incident' : 'Resume latest incident'}
        hint="Continue capturing where you left off"
        onPress={onResume}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff3cd',
    borderColor: '#856404',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  label: { fontSize: 18, fontWeight: '600', color: '#000' },
});
