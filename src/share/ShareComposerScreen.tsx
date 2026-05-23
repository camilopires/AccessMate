import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet } from 'react-native';
import { BigActionButton } from '../components/BigActionButton';
import { ProfileChip } from '../components/ProfileChip';
import { redactStaffNames, redact } from './redact';
import { sizeForPlatform, PLATFORM_LIMITS } from './sizer';
import type { SharePlatform } from './sizer';
import { SUGGESTED_HASHTAGS } from './deep-links';

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

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        Share
      </Text>

      <View style={styles.section}>
        <Text style={styles.label} accessibilityRole="header">
          Platform
        </Text>
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
        <Text style={styles.label}>What to share</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          style={styles.input}
          accessibilityLabel="Share text"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label} accessibilityRole="header">
          Privacy
        </Text>
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

      <View style={styles.section}>
        <Text style={styles.label} accessibilityRole="header">
          Suggested hashtags
        </Text>
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
        <Text style={styles.label} accessibilityRole="header">
          What gets shared ({preview.length}
          {PLATFORM_LIMITS[platform] !== Infinity ? `/${PLATFORM_LIMITS[platform]}` : ''})
        </Text>
        <Text style={styles.preview} testID="share-preview" accessibilityRole="text">
          {preview}
        </Text>
      </View>

      <BigActionButton
        label={`Open in ${platform[0].toUpperCase() + platform.slice(1)}`}
        hint="Open the platform compose window with this text"
        onPress={() => onOpenShare(platform, preview)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, backgroundColor: '#fff', gap: 16 },
  h1: { fontSize: 28, fontWeight: '700', color: '#000' },
  section: { gap: 8 },
  label: { fontSize: 18, fontWeight: '600', color: '#000' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    borderWidth: 2,
    borderColor: '#1f6feb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    color: '#000',
    textAlignVertical: 'top',
  },
  preview: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f6f8fa',
    padding: 12,
    borderRadius: 8,
  },
});
