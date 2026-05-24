import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, minTapTarget, radius, space, type } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  hint?: string;
  /** 'primary' = filled accent, 'secondary' = outlined, 'ghost' = text-only. */
  variant?: 'primary' | 'secondary' | 'ghost';
  testID?: string;
}

export function BigActionButton({ label, onPress, hint, variant = 'primary', testID }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && variant === 'primary' && styles.primaryPressed,
        pressed && variant === 'secondary' && styles.secondaryPressed,
        pressed && variant === 'ghost' && styles.ghostPressed,
      ]}
      testID={testID}
    >
      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'secondary' && styles.labelSecondary,
            variant === 'ghost' && styles.labelGhost,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: minTapTarget,
    paddingHorizontal: space.xl,
    paddingVertical: space.base,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent.base },
  primaryPressed: { backgroundColor: colors.accent.deep },
  secondary: {
    backgroundColor: colors.bg.raised,
    borderWidth: 1,
    borderColor: colors.line.hairline,
  },
  secondaryPressed: { backgroundColor: colors.bg.sunken },
  ghost: { backgroundColor: 'transparent' },
  ghostPressed: { backgroundColor: colors.bg.sunken },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { ...type.action },
  labelPrimary: { color: colors.ink.onAccent },
  labelSecondary: { color: colors.ink.primary },
  labelGhost: { color: colors.accent.deep },
});
