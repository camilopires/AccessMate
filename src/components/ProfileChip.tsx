import { Pressable, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  selected: boolean;
  onToggle: () => void;
  testID?: string;
}

export function ProfileChip({ label, selected, onToggle, testID }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={[styles.chip, selected && styles.chipOn]}
      testID={testID}
    >
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1f6feb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: {
    backgroundColor: '#1f6feb',
  },
  label: {
    color: '#1f6feb',
    fontSize: 16,
    fontWeight: '600',
  },
  labelOn: {
    color: '#fff',
  },
});
