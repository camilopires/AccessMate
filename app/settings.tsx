import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../src/components/AppShell';
import { AppHeader } from '../src/components/AppHeader';
import { BigActionButton } from '../src/components/BigActionButton';
import { ProfileChip } from '../src/components/ProfileChip';
import { SectionLabel } from '../src/components/SectionLabel';
import { getSettingsStore } from '../src/settings/factory';
import type { Settings, AiProvider } from '../src/settings/store';
import { exportAllData, wipeAllData } from '../src/settings/data-ops';
import { colors, space, type } from '../src/theme';

const AI_PROVIDERS: { id: AiProvider; label: string }[] = [
  { id: 'off', label: 'AI off' },
  { id: 'on-device', label: 'On-device only' },
  { id: 'cloud', label: 'On-device + cloud' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const store = useMemo(() => getSettingsStore(), []);
  const [settings, setSettings] = useState<Settings>(() => store.get());

  const update = (patch: Partial<Settings>) => {
    store.update(patch);
    setSettings(store.get());
  };

  const onWipe = () => {
    Alert.alert(
      'Wipe all data?',
      'This permanently removes all profiles, incidents, complaints, and settings on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe',
          style: 'destructive',
          onPress: () => {
            try {
              wipeAllData();
              router.replace('/');
            } catch (e) {
              Alert.alert('Wipe failed', e instanceof Error ? e.message : 'Unknown error');
            }
          },
        },
      ],
    );
  };

  return (
    <AppShell>
      <AppHeader title="Settings" overline="Preferences" />

      <View style={styles.section}>
        <SectionLabel>Accessibility</SectionLabel>
        <View style={styles.row}>
          <ProfileChip
            label="High contrast"
            selected={settings.highContrast}
            onToggle={() => update({ highContrast: !settings.highContrast })}
          />
          <ProfileChip
            label="Reduce motion"
            selected={settings.reduceMotion}
            onToggle={() => update({ reduceMotion: !settings.reduceMotion })}
          />
        </View>
        <Text style={styles.caption}>Font scale · {settings.fontScale.toFixed(1)}x</Text>
        <View style={styles.row}>
          {[1.0, 1.2, 1.4, 1.6, 2.0].map((s) => (
            <ProfileChip
              key={s}
              label={`${s.toFixed(1)}x`}
              selected={Math.abs(settings.fontScale - s) < 0.01}
              onToggle={() => update({ fontScale: s })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>AI provider</SectionLabel>
        <View style={styles.row}>
          {AI_PROVIDERS.map((p) => (
            <ProfileChip
              key={p.id}
              label={p.label}
              selected={settings.aiProvider === p.id}
              onToggle={() => update({ aiProvider: p.id })}
            />
          ))}
        </View>
        <Text style={styles.caption}>
          On-device and cloud AI light up the &ldquo;Polish with AI&rdquo; button in the complaint
          composer. Stays off by default.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionLabel>Your data</SectionLabel>
        <BigActionButton
          label="Export all data (JSON)"
          hint="Download every saved profile, incident, and complaint"
          variant="secondary"
          onPress={() => {
            exportAllData().catch((e) =>
              Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error'),
            );
          }}
        />
        <BigActionButton
          label="Wipe device data"
          hint="Permanently delete all locally stored AccessMate data"
          variant="ghost"
          onPress={onWipe}
        />
      </View>

      <View style={styles.section}>
        <SectionLabel>About</SectionLabel>
        <Text style={styles.body}>
          AccessMate is an accessibility-first travel companion. All data stays on your device
          unless you explicitly share or export it. Encrypted cross-device sync is planned for the
          native release.
        </Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  caption: { ...type.caption, color: colors.ink.muted },
  body: { ...type.body, color: colors.ink.primary },
});
