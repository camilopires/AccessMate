import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, space } from '../theme';

interface Props {
  children: React.ReactNode;
  /** If true the children are wrapped in a vertical ScrollView. */
  scroll?: boolean;
  /** Padding override; defaults to comfortable 20pt edges. */
  pad?: number;
}

export function AppShell({ children, scroll = true, pad = space.lg }: Props) {
  const inner = (
    <View style={[styles.inner, { paddingHorizontal: pad, paddingBottom: space['3xl'] }]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.paper },
  scrollContent: { flexGrow: 1 },
  inner: { paddingTop: space.lg, gap: space.lg },
});
