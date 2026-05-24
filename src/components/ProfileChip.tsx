import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, space, type } from '../theme';

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
      // RN-Web doesn't always translate accessibilityState.checked to
      // aria-checked when the host element is a Pressable (not a real
      // <Switch>). Set the ARIA attribute explicitly so axe is happy.
      aria-checked={selected}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        pressed && (selected ? styles.chipOnPressed : styles.chipPressed),
      ]}
      testID={testID}
    >
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: space.base,
    paddingVertical: space.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line.hairline,
    backgroundColor: colors.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
    marginBottom: space.sm,
  },
  chipPressed: { backgroundColor: colors.bg.sunken },
  chipOn: {
    backgroundColor: colors.accent.base,
    borderColor: colors.accent.base,
  },
  chipOnPressed: { backgroundColor: colors.accent.deep, borderColor: colors.accent.deep },
  label: { ...type.bodyEmphasis, color: colors.ink.primary, fontSize: 15 },
  labelOn: { color: colors.ink.onAccent },
});
