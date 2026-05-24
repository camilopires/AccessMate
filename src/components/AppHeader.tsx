import { Text, View, StyleSheet } from 'react-native';
import { colors, space, type } from '../theme';

interface Props {
  title: string;
  /** Small caps overline above the title (e.g. a date). */
  overline?: string;
  /** Optional supporting line below the title. */
  subtitle?: string;
}

export function AppHeader({ title, overline, subtitle }: Props) {
  return (
    <View style={styles.root}>
      {overline && <Text style={styles.overline}>{overline}</Text>}
      <Text
        accessibilityRole="header"
        // Underlying RN doesn't strongly expose heading levels; the role is
        // enough for VoiceOver. axe-core on web sees it as <h1>.
        style={styles.title}
      >
        {title}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xs },
  overline: { ...type.label, color: colors.ink.muted },
  title: { ...type.display, color: colors.ink.primary },
  subtitle: { ...type.body, color: colors.ink.muted, marginTop: space.xs },
  rule: {
    height: 2,
    width: 56,
    backgroundColor: colors.accent.base,
    marginTop: space.md,
  },
});
