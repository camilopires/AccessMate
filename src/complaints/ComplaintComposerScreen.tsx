import { View, Text, TextInput, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { BigActionButton } from '../components/BigActionButton';
import { DestinationCard } from '../components/DestinationCard';
import { SectionLabel } from '../components/SectionLabel';
import { colors, radius, space, type } from '../theme';
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
    <AppShell>
      <AppHeader title="Compose complaint" overline="Draft" />

      {selectedTemplateId == null ? (
        <View>
          <SectionLabel>Pick a scenario</SectionLabel>
          {templates.map((t) => (
            <DestinationCard
              key={t.id}
              title={t.title}
              caption={`${t.mode.toUpperCase()} · regulator ${t.regulator.toUpperCase()}`}
              onPress={() => onSelectTemplate(t.id)}
            />
          ))}
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <SectionLabel>Your draft</SectionLabel>
            <TextInput
              value={draftText}
              onChangeText={onChangeDraft}
              multiline
              accessibilityLabel="Complaint draft"
              style={styles.draftInput}
            />
          </View>
          <View style={styles.section}>
            <SectionLabel>What gets sent</SectionLabel>
            <Text style={styles.preview} accessibilityRole="text">
              {draftText}
            </Text>
          </View>
          {onPolish && (
            <View style={styles.section}>
              <BigActionButton
                label={polishStatus === 'working' ? 'Polishing…' : 'Polish with AI'}
                hint="Improve the draft's clarity without changing the facts or citations"
                variant="secondary"
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
              variant="secondary"
              onPress={onCopy}
            />
            <BigActionButton
              label="Export PDF"
              hint="Open a print-ready PDF of this draft"
              variant="secondary"
              onPress={onExportPdf}
            />
          </View>
        </>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  draftInput: {
    ...type.body,
    borderWidth: 1,
    borderColor: colors.line.hairline,
    backgroundColor: colors.bg.raised,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
    minHeight: 220,
    color: colors.ink.primary,
    textAlignVertical: 'top',
  },
  preview: {
    ...type.caption,
    color: colors.ink.muted,
    backgroundColor: colors.bg.sunken,
    padding: space.md,
    borderRadius: radius.md,
  },
  note: { ...type.caption, color: colors.ink.muted },
});
