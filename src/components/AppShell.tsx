import { SafeAreaView, ScrollView, StyleSheet, View, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors, minTapTarget, space, type } from '../theme';

interface Props {
  children: React.ReactNode;
  /** If true the children are wrapped in a vertical ScrollView. */
  scroll?: boolean;
  /** Padding override; defaults to comfortable 20pt edges. */
  pad?: number;
  /** When true (default), shows a back affordance at the top that calls
   *  router.back(). Set to false on the home / onboarding screens which
   *  sit at the top of the stack. */
  back?: boolean;
  /** When true, the SafeAreaView background is transparent so a parent
   *  GlassSurface (e.g. modal sheet root) shows through. */
  transparent?: boolean;
}

export function AppShell({
  children,
  scroll = true,
  pad = space.lg,
  back = true,
  transparent = false,
}: Props) {
  const router = useRouter();
  const canGoBack = back && (router.canGoBack?.() ?? false);
  const inner = (
    <View style={[styles.inner, { paddingHorizontal: pad, paddingBottom: space['3xl'] }]}>
      {canGoBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
          hitSlop={12}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      )}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={[styles.safe, transparent && styles.safeTransparent]}>
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
  safeTransparent: { backgroundColor: 'transparent' },
  scrollContent: { flexGrow: 1 },
  inner: { paddingTop: space.lg, gap: space.lg },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: minTapTarget - 16,
    paddingVertical: space.xs,
    paddingRight: space.sm,
    gap: 4,
    marginLeft: -4,
  },
  backPressed: { opacity: 0.55 },
  backArrow: {
    ...type.title,
    color: colors.ink.muted,
    lineHeight: 28,
    fontSize: 28,
    marginTop: -2,
  },
  backLabel: { ...type.bodyEmphasis, color: colors.ink.muted },
});
