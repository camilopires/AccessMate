import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BigActionButton } from '../src/components/BigActionButton';
import { ProfileChip } from '../src/components/ProfileChip';
import { getSettingsStore } from '../src/settings/factory';
import type { Settings, AiProvider } from '../src/settings/store';
import { exportAllData, wipeAllData } from '../src/settings/data-ops';

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
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        Settings
      </Text>

      <View style={styles.section}>
        <Text style={styles.label} accessibilityRole="header">
          Accessibility
        </Text>
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
        <Text style={styles.label}>Font scale: {settings.fontScale.toFixed(1)}x</Text>
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
        <Text style={styles.label} accessibilityRole="header">
          AI provider
        </Text>
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
        <Text style={styles.note}>
          On-device and cloud AI will be enabled in a later release. The toggle here records your
          preference so future builds default to it.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label} accessibilityRole="header">
          Your data
        </Text>
        <BigActionButton
          label="Export all data (JSON)"
          hint="Download every saved profile, incident, and complaint"
          onPress={() => {
            exportAllData().catch((e) =>
              Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error'),
            );
          }}
        />
        <BigActionButton
          label="Wipe device data"
          hint="Permanently delete all locally stored AccessMate data"
          onPress={onWipe}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label} accessibilityRole="header">
          About
        </Text>
        <Text style={styles.note}>
          AccessMate is an accessibility-first travel companion. All data stays on your device
          unless you explicitly share or export it. Encrypted cross-device sync is planned for the
          native release.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, backgroundColor: '#fff', gap: 16 },
  h1: { fontSize: 28, fontWeight: '700', color: '#000' },
  section: { gap: 8 },
  label: { fontSize: 18, fontWeight: '600', color: '#000' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { fontSize: 14, color: '#444' },
});
