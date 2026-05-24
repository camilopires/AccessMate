import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '../../src/theme';
import { GlassSurface } from '../../src/components/GlassSurface';

export default function TabLayout() {
  const isIOS = Platform.OS === 'ios';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // accent.base on paper is 4.28:1 at 12px — fails WCAG AA for small text.
        // accent.deep (#7A3A0F) on paper is ~9:1 and reads better as a tab tint.
        tabBarActiveTintColor: colors.accent.deep,
        tabBarInactiveTintColor: colors.ink.muted,
        tabBarStyle: isIOS
          ? {
              // Let the GlassSurface own the background on iOS 26+.
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              position: 'absolute',
            }
          : {
              backgroundColor: colors.bg.paper,
              borderTopColor: colors.line.hairline,
            },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarBackground: isIOS
          ? () => <GlassSurface tint="chrome" style={{ flex: 1 }} />
          : undefined,
      }}
    >
      <Tabs.Screen name="incidents" options={{ title: 'Incidents' }} />
      <Tabs.Screen name="passport" options={{ title: 'Passport' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
