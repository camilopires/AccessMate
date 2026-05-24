import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, minTapTarget, radius, space, type } from '../theme';

interface Props {
  title: string;
  caption?: string;
  actionLabel: string;
  onPress: () => void;
}

/** Soft amber alert (resume banner, time-to-escalate, etc). Not destructive. */
export function AlertCard({ title, caption, actionLabel, onPress }: Props) {
  return (
    <View accessibilityRole="alert" style={styles.card}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {caption && <Text style={styles.caption}>{caption}</Text>}
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
        <Text style={styles.actionArrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.alert.soft,
    borderColor: colors.alert.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  text: { gap: 4 },
  title: { ...type.heading, color: colors.alert.base },
  caption: { ...type.caption, color: colors.ink.muted },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: minTapTarget - 12,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.alert.base,
  },
  actionPressed: { opacity: 0.85 },
  actionText: { ...type.action, color: colors.ink.onAccent },
  actionArrow: { ...type.title, color: colors.ink.onAccent, lineHeight: 26 },
});
