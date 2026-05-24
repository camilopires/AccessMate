import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { BigActionButton } from '../components/BigActionButton';
import { SectionLabel } from '../components/SectionLabel';
import { colors, radius, space, type } from '../theme';

interface Props {
  incidentId: string;
  mediaCount: number;
  onAttachNote: (text: string) => void;
  onTakePhoto: () => void;
  onRecordAudio: () => void;
  onSave: (summary: string) => void;
  onDiscard: () => void;
}

export function IncidentCaptureScreen({
  mediaCount,
  onAttachNote,
  onTakePhoto,
  onRecordAudio,
  onSave,
  onDiscard,
}: Props) {
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');

  return (
    <AppShell>
      <AppHeader
        title="Something went wrong"
        overline="Capturing now"
        subtitle={`${mediaCount} item${mediaCount === 1 ? '' : 's'} captured so far`}
      />

      <View style={styles.section}>
        <SectionLabel>What happened?</SectionLabel>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What happened? (optional)"
          placeholderTextColor={colors.ink.soft}
          accessibilityLabel="Note about what happened"
          style={[styles.input, styles.multiline]}
          multiline
        />
        <BigActionButton
          label="Add note"
          hint="Save this note as part of the incident"
          variant="secondary"
          onPress={() => {
            const trimmed = note.trim();
            if (trimmed.length === 0) return;
            onAttachNote(trimmed);
            setNote('');
          }}
        />
      </View>

      <View style={styles.section}>
        <SectionLabel>Evidence</SectionLabel>
        <BigActionButton
          label="Add a photo"
          hint="Open the camera to attach a photo"
          variant="secondary"
          onPress={onTakePhoto}
        />
        <BigActionButton
          label="Record audio"
          hint="Start an audio recording"
          variant="secondary"
          onPress={onRecordAudio}
        />
      </View>

      <View style={styles.section}>
        <SectionLabel>Short summary (for your records)</SectionLabel>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Short summary"
          placeholderTextColor={colors.ink.soft}
          accessibilityLabel="Short summary"
          style={styles.input}
        />
        <BigActionButton
          label="Save & finish"
          hint="Save this incident to your timeline"
          onPress={() => onSave(summary.trim())}
        />
        <BigActionButton
          label="Discard"
          hint="Throw away this incident without saving"
          variant="ghost"
          onPress={onDiscard}
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  input: {
    ...type.body,
    borderWidth: 1,
    borderColor: colors.line.hairline,
    backgroundColor: colors.bg.raised,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
    minHeight: 48,
    color: colors.ink.primary,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
