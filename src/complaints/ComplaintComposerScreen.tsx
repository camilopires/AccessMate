import { ScrollView, View, Text, TextInput, StyleSheet } from 'react-native';
import { BigActionButton } from '../components/BigActionButton';
import type { ComplaintTemplate } from './schemas';

interface Props {
  templates: ComplaintTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  draftText: string;
  onChangeDraft: (s: string) => void;
  onSendEmail: () => void;
  onCopy: () => void;
  onExportPdf: () => void;
  onPolish?: () => void;
  polishStatus?: 'idle' | 'working' | 'apple-fm' | 'cloud' | 'none';
}

export function ComplaintComposerScreen({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  draftText,
  onChangeDraft,
  onSendEmail,
  onCopy,
  onExportPdf,
  onPolish,
  polishStatus = 'idle',
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        Compose complaint
      </Text>

      {selectedTemplateId == null ? (
        <View style={styles.section}>
          <Text style={styles.label} accessibilityRole="header">
            Pick a scenario
          </Text>
          {templates.map((t) => (
            <BigActionButton
              key={t.id}
              label={t.title}
              hint={`Use the ${t.title} template`}
              onPress={() => onSelectTemplate(t.id)}
            />
          ))}
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.label} accessibilityRole="header">
              Your draft
            </Text>
            <TextInput
              value={draftText}
              onChangeText={onChangeDraft}
              multiline
              accessibilityLabel="Complaint draft"
              style={styles.draftInput}
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.label} accessibilityRole="header">
              What gets sent
            </Text>
            <Text style={styles.preview} accessibilityRole="text">
              {draftText}
            </Text>
          </View>
          {onPolish && (
            <View style={styles.section}>
              <BigActionButton
                label={polishStatus === 'working' ? 'Polishing…' : 'Polish with AI'}
                hint="Improve the draft's clarity without changing the facts or citations"
                onPress={onPolish}
              />
              {polishStatus === 'apple-fm' && (
                <Text style={styles.note}>Polished on-device with Apple Foundation Models.</Text>
              )}
              {polishStatus === 'cloud' && (
                <Text style={styles.note}>Polished by the cloud proxy.</Text>
              )}
              {polishStatus === 'none' && (
                <Text style={styles.note}>No AI polish available; using your template draft.</Text>
              )}
            </View>
          )}
          <View style={styles.section}>
            <BigActionButton
              label="Send by email"
              hint="Open your email app with this draft"
              onPress={onSendEmail}
            />
            <BigActionButton
              label="Copy to clipboard"
              hint="Copy the draft so you can paste it elsewhere"
              onPress={onCopy}
            />
            <BigActionButton
              label="Export PDF"
              hint="Open a print-ready PDF of this draft"
              onPress={onExportPdf}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, gap: 16, backgroundColor: '#fff' },
  h1: { fontSize: 28, fontWeight: '700', color: '#000' },
  section: { gap: 8 },
  label: { fontSize: 18, fontWeight: '600', color: '#000' },
  draftInput: {
    borderWidth: 2,
    borderColor: '#1f6feb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 220,
    color: '#000',
    textAlignVertical: 'top',
  },
  preview: {
    fontSize: 14,
    color: '#222',
    backgroundColor: '#f6f8fa',
    padding: 12,
    borderRadius: 8,
  },
  note: { fontSize: 14, color: '#444' },
});
