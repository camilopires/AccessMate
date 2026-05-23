import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet } from 'react-native';
import { BigActionButton } from '../components/BigActionButton';

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
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        Something went wrong
      </Text>

      <Text style={styles.subhead} accessibilityRole="text">
        {mediaCount} item{mediaCount === 1 ? '' : 's'} captured so far
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>What happened?</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What happened? (optional)"
          accessibilityLabel="Note about what happened"
          style={styles.input}
          multiline
        />
        <BigActionButton
          label="Add note"
          hint="Save this note as part of the incident"
          onPress={() => {
            const trimmed = note.trim();
            if (trimmed.length === 0) return;
            onAttachNote(trimmed);
            setNote('');
          }}
        />
      </View>

      <View style={styles.section}>
        <BigActionButton
          label="Add a photo"
          hint="Open the camera to attach a photo"
          onPress={onTakePhoto}
        />
        <BigActionButton
          label="Record audio"
          hint="Start an audio recording"
          onPress={onRecordAudio}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Short summary (for your records)</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Short summary"
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
          onPress={onDiscard}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, gap: 16, backgroundColor: '#fff' },
  h1: { fontSize: 28, fontWeight: '700', color: '#000' },
  subhead: { fontSize: 16, color: '#444' },
  section: { gap: 8 },
  label: { fontSize: 16, fontWeight: '600', color: '#000' },
  input: {
    borderWidth: 2,
    borderColor: '#1f6feb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
    color: '#000',
  },
});
