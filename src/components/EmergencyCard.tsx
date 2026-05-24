import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, minTapTarget, radius, space, type } from '../theme';

interface Props {
  title: string;
  caption?: string;
  onPress: () => void;
  testID?: string;
}

/** The "Something went wrong" CTA. Visually distinct from any other action
 *  so it remains the first thing a user finds in a stressful moment. */
export function EmergencyCard({ title, caption, onPress, testID }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={caption}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      testID={testID}
    >
      <View style={styles.dotRow}>
        <View style={styles.dot} />
        <Text style={styles.label}>Help now</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: minTapTarget + 24,
    paddingVertical: space.xl,
    paddingHorizontal: space.xl,
    backgroundColor: colors.emergency.base,
    borderRadius: radius.lg,
    gap: space.sm,
  },
  cardPressed: { backgroundColor: colors.emergency.deep },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink.onEmergency },
  label: { ...type.label, color: colors.ink.onEmergency, opacity: 0.85 },
  title: { ...type.title, color: colors.ink.onEmergency },
  caption: { ...type.caption, color: colors.ink.onEmergency, opacity: 0.9 },
});
