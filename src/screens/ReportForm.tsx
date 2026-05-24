import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { BigActionButton } from '../components/BigActionButton';
import { DestinationCard } from '../components/DestinationCard';
import { ProfileChip } from '../components/ProfileChip';
import { SectionLabel } from '../components/SectionLabel';
import { assembleDraft } from '../incidents/assemble';
import type { ComplaintTemplate } from '../incidents/template-schemas';
import type { OperatorEntry } from '../content/schemas';
import type { IncidentFacts } from '../incidents/schemas';
import { colors, space, type } from '../theme';

export interface ReportDraft {
  title: string;
  facts: IncidentFacts;
  templateId: string;
  draftBody: string;
  recipient?: string;
  operatorId?: string;
}

interface Props {
  operators: OperatorEntry[];
  templates: ComplaintTemplate[];
  onComplete: (draft: ReportDraft) => void;
  onCancel: () => void;
  /** Drop the paper background so a parent glass surface shows through. */
  transparent?: boolean;
}

type Step = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Step, string> = {
  1: 'When did this happen?',
  2: 'Which operator?',
  3: 'What kind of failure?',
  4: 'Were you alone or accompanied?',
};

export function ReportForm({
  operators,
  templates,
  onComplete,
  onCancel,
  transparent = false,
}: Props) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [step, setStep] = useState<Step>(1);
  const [whenISO, setWhenISO] = useState<string>(today);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [accompanied, setAccompanied] = useState<boolean | null>(null);

  const operator = operators.find((o) => o.id === operatorId);
  const template = templates.find((t) => t.id === scenarioId);

  const next = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else complete();
  };

  const complete = () => {
    if (!template) return;
    const facts: IncidentFacts = {
      whenISO: `${whenISO}T12:00:00Z`,
      mode: template.mode,
      operatorName: operator?.name,
      scenarioId: template.id,
      accompanied: accompanied ?? undefined,
    };
    const draftBody = assembleDraft({
      incident: {
        id: 'preview',
        status: 'draft',
        startedAtISO: `${whenISO}T12:00:00Z`,
        operatorId: operator?.id,
        events: [],
      },
      profile: { emergencyContacts: [] },
      template,
      operatorName: operator?.name,
    });
    onComplete({
      title: `${template.title}${operator ? ` — ${operator.name}` : ''}`,
      facts,
      templateId: template.id,
      draftBody,
      recipient: operator?.complaintsRoute.primaryEmail,
      operatorId: operator?.id,
    });
  };

  return (
    <AppShell back={false} transparent={transparent}>
      <AppHeader title="New report" overline={`Step ${step} of 4`} />

      <View style={styles.progress}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={[styles.tick, s <= step && styles.tickActive]} />
        ))}
      </View>

      <SectionLabel>{STEP_TITLES[step]}</SectionLabel>

      {step === 1 && (
        <View style={styles.row}>
          <ProfileChip
            label="Today"
            selected={whenISO === today}
            onToggle={() => setWhenISO(today)}
          />
          <ProfileChip
            label="Yesterday"
            selected={whenISO === yesterday()}
            onToggle={() => setWhenISO(yesterday())}
          />
          <ProfileChip
            label="Earlier this week"
            selected={whenISO === lastWeek()}
            onToggle={() => setWhenISO(lastWeek())}
          />
        </View>
      )}

      {step === 2 && (
        <View>
          {operators.map((o) => (
            <DestinationCard
              key={o.id}
              title={o.name}
              caption={o.mode.toUpperCase()}
              onPress={() => setOperatorId(o.id)}
              emphasis={operatorId === o.id ? 'accent' : 'default'}
            />
          ))}
        </View>
      )}

      {step === 3 && (
        <View>
          {templates.map((t) => (
            <DestinationCard
              key={t.id}
              title={t.title}
              caption={`${t.mode.toUpperCase()} · regulator ${t.regulator.toUpperCase()}`}
              onPress={() => setScenarioId(t.id)}
              emphasis={scenarioId === t.id ? 'accent' : 'default'}
            />
          ))}
        </View>
      )}

      {step === 4 && (
        <View style={styles.row}>
          <ProfileChip
            label="Alone"
            selected={accompanied === false}
            onToggle={() => setAccompanied(false)}
          />
          <ProfileChip
            label="Accompanied"
            selected={accompanied === true}
            onToggle={() => setAccompanied(true)}
          />
        </View>
      )}

      <View style={styles.actions}>
        <BigActionButton
          label={step < 4 ? 'Next' : 'Draft complaint'}
          hint={
            step < 4
              ? 'Continue'
              : 'Assemble a complaint from this template; you can edit before sending'
          }
          onPress={next}
        />
        {step === 1 && (
          <BigActionButton
            label="Cancel"
            hint="Close without saving"
            variant="ghost"
            onPress={onCancel}
          />
        )}
        {step > 1 && (
          <BigActionButton
            label="Back"
            hint="Previous step"
            variant="secondary"
            onPress={() => setStep((s) => (s - 1) as Step)}
          />
        )}
      </View>

      <Text style={styles.note}>
        Step {step} of 4. You can change anything from the editor afterwards.
      </Text>
    </AppShell>
  );
}

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function lastWeek(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 6, marginTop: space.xs },
  tick: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line.hairline },
  tickActive: { backgroundColor: colors.accent.base },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  actions: { gap: space.sm, marginTop: space.lg },
  note: { ...type.caption, color: colors.ink.muted, textAlign: 'center' },
});
