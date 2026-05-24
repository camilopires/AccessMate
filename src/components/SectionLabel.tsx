import { Text, View, StyleSheet } from 'react-native';
import { colors, space, type } from '../theme';

interface Props {
  children: string;
  /** A right-aligned counter or hint. */
  trailing?: string;
}

export function SectionLabel({ children, trailing }: Props) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.label}>
        {children}
      </Text>
      {trailing && <Text style={styles.trailing}>{trailing}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  label: { ...type.label, color: colors.ink.muted },
  trailing: { ...type.label, color: colors.ink.soft },
});
