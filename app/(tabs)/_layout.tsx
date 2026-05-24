import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // accent.base on paper is 4.28:1 at 12px — fails WCAG AA for small text.
        // accent.deep (#7A3A0F) on paper is ~9:1 and reads better as a tab tint.
        tabBarActiveTintColor: colors.accent.deep,
        tabBarInactiveTintColor: colors.ink.muted,
        tabBarStyle: {
          backgroundColor: colors.bg.paper,
          borderTopColor: colors.line.hairline,
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="incidents" options={{ title: 'Incidents' }} />
      <Tabs.Screen name="passport" options={{ title: 'Passport' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
