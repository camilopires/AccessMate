import { Pressable, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  hint?: string;
  testID?: string;
}

export function BigActionButton({ label, onPress, hint, testID }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#1f6feb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  label: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
