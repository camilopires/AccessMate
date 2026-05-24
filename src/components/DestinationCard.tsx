import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, minTapTarget, radius, space, type } from '../theme';

interface Props {
  title: string;
  caption?: string;
  /** Optional small overline (e.g. section index "01"). */
  index?: string;
  onPress: () => void;
  /** Render with the accent fill (use sparingly for the primary CTA on a page). */
  emphasis?: 'default' | 'accent';
  /** Optional badge text (e.g. "3 new"). */
  badge?: string;
  testID?: string;
}

export function DestinationCard({
  title,
  caption,
  index,
  onPress,
  emphasis = 'default',
  badge,
  testID,
}: Props) {
  const accent = emphasis === 'accent';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={caption}
      style={({ pressed }) => [
        styles.card,
        accent && styles.cardAccent,
        pressed && (accent ? styles.cardAccentPressed : styles.cardPressed),
      ]}
      testID={testID}
    >
      <View style={styles.row}>
        <View style={styles.text}>
          {index && <Text style={[styles.index, accent && styles.indexAccent]}>{index}</Text>}
          <Text style={[styles.title, accent && styles.titleAccent]}>{title}</Text>
          {caption && (
            <Text style={[styles.caption, accent && styles.captionAccent]}>{caption}</Text>
          )}
        </View>
        <View style={styles.trailing}>
          {badge && (
            <View style={[styles.badge, accent && styles.badgeAccent]}>
              <Text style={[styles.badgeText, accent && styles.badgeTextAccent]}>{badge}</Text>
            </View>
          )}
          <Text style={[styles.chevron, accent && styles.chevronAccent]}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: minTapTarget,
    paddingVertical: space.base,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line.hairline,
    backgroundColor: 'transparent',
  },
  cardPressed: { backgroundColor: colors.bg.sunken },
  cardAccent: {
    backgroundColor: colors.accent.base,
    borderRadius: radius.lg,
    borderBottomWidth: 0,
    paddingVertical: space.xl,
    paddingHorizontal: space.xl,
    marginTop: space.sm,
  },
  cardAccentPressed: { backgroundColor: colors.accent.deep },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  index: { ...type.label, color: colors.ink.muted },
  indexAccent: { color: colors.ink.onAccent, opacity: 0.85 },
  title: { ...type.action, color: colors.ink.primary },
  titleAccent: { ...type.action, color: colors.ink.onAccent },
  caption: { ...type.caption, color: colors.ink.muted, marginTop: 2 },
  captionAccent: { ...type.caption, color: colors.ink.onAccent, opacity: 0.9 },
  chevron: { ...type.title, color: colors.ink.muted, lineHeight: 26 },
  chevronAccent: { ...type.title, color: colors.ink.onAccent, lineHeight: 26 },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.soft,
  },
  badgeAccent: { backgroundColor: 'rgba(255,255,255,0.18)' },
  badgeText: { ...type.label, color: colors.accent.deep, letterSpacing: 1 },
  badgeTextAccent: { color: colors.ink.onAccent },
});
