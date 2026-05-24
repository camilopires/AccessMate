import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { BigActionButton } from '../components/BigActionButton';
import { ProfileChip } from '../components/ProfileChip';
import { SectionLabel } from '../components/SectionLabel';
import { redactStaffNames, redact } from './redact';
import { sizeForPlatform, PLATFORM_LIMITS } from './sizer';
import type { SharePlatform } from './sizer';
import { SUGGESTED_HASHTAGS } from './deep-links';
import { colors, radius, space, type } from '../theme';

interface Props {
  initialText: string;
  operatorName?: string;
  onOpenShare: (platform: SharePlatform, text: string) => void;
}

const PLATFORMS: { id: SharePlatform; label: string }[] = [
  { id: 'x', label: 'X' },
  { id: 'bluesky', label: 'Bluesky' },
  { id: 'threads', label: 'Threads' },
  { id: 'instagram', label: 'Instagram' },
];

export function ShareComposerScreen({ initialText, operatorName, onOpenShare }: Props) {
  const [text, setText] = useState(initialText);
  const [platform, setPlatform] = useState<SharePlatform>('x');
  const [maskOperator, setMaskOperator] = useState(false);
  const [maskDateTime, setMaskDateTime] = useState(false);

  const preview = useMemo(() => {
    const redacted = redact(redactStaffNames(text), { maskOperator, operatorName, maskDateTime });
    return sizeForPlatform(redacted, platform);
  }, [text, platform, maskOperator, operatorName, maskDateTime]);

  const limit = PLATFORM_LIMITS[platform];

  return (
    <AppShell>
      <AppHeader title="Share" overline="Compose post" />

      <View style={styles.section}>
        <SectionLabel>Platform</SectionLabel>
        <View style={styles.row}>
          {PLATFORMS.map((p) => (
            <ProfileChip
              key={p.id}
              label={p.label}
              selected={platform === p.id}
              onToggle={() => setPlatform(p.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>What to share</SectionLabel>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          style={styles.input}
          accessibilityLabel="Share text"
        />
      </View>

      <View style={styles.section}>
        <SectionLabel>Privacy</SectionLabel>
        <View style={styles.row}>
          {operatorName && (
            <ProfileChip
              label="Mask operator name"
              selected={maskOperator}
              onToggle={() => setMaskOperator((v) => !v)}
            />
          )}
          <ProfileChip
            label="Mask dates and times"
            selected={maskDateTime}
            onToggle={() => setMaskDateTime((v) => !v)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>Suggested hashtags</SectionLabel>
        <View style={styles.row}>
          {SUGGESTED_HASHTAGS.map((h) => (
            <ProfileChip
              key={h}
              label={h}
              selected={text.includes(h)}
              onToggle={() =>
                setText((cur) =>
                  cur.includes(h)
                    ? cur.replace(new RegExp(`\\s*${h}`), '').trim()
                    : `${cur} ${h}`.trim(),
                )
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel trailing={`${preview.length}${limit !== Infinity ? ` / ${limit}` : ''}`}>
          What gets shared
        </SectionLabel>
        <Text style={styles.preview} testID="share-preview" accessibilityRole="text">
          {preview}
        </Text>
      </View>

      <BigActionButton
        label={`Open in ${platform[0].toUpperCase() + platform.slice(1)}`}
        hint="Open the platform compose window with this text"
        onPress={() => onOpenShare(platform, preview)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    ...type.body,
    borderWidth: 1,
    borderColor: colors.line.hairline,
    backgroundColor: colors.bg.raised,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
    minHeight: 120,
    color: colors.ink.primary,
    textAlignVertical: 'top',
  },
  preview: {
    ...type.body,
    color: colors.ink.primary,
    backgroundColor: colors.bg.sunken,
    padding: space.md,
    borderRadius: radius.md,
  },
});
