import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../src/components/AppShell';
import { AppHeader } from '../src/components/AppHeader';
import { BigActionButton } from '../src/components/BigActionButton';
import { ProfileChip } from '../src/components/ProfileChip';
import { SectionLabel } from '../src/components/SectionLabel';
import { getSettingsStore } from '../src/settings/factory';
import { getProfileStore } from '../src/profile/store';
import type { Profile } from '../src/profile/schemas';
import { colors, radius, space, type } from '../src/theme';

type Step = 1 | 2 | 3 | 4 | 5;

interface Draft {
  isBlind?: boolean;
  isLowVision?: boolean;
  isDeaf?: boolean;
  isHardOfHearing?: boolean;
  wheelchairType?: 'manual' | 'powered' | 'mobility-scooter';
  prefersBSL?: boolean;
  prefersWriting?: boolean;
  needsExtraTime?: boolean;
  contactName?: string;
  contactPhone?: string;
  notifications?: boolean;
}

function toProfile(d: Draft): Profile {
  return {
    emergencyContacts:
      d.contactName && d.contactPhone ? [{ name: d.contactName, phone: d.contactPhone }] : [],
    sensory: {
      isBlind: d.isBlind,
      isLowVision: d.isLowVision,
      isDeaf: d.isDeaf,
      isHardOfHearing: d.isHardOfHearing,
    },
    mobility: d.wheelchairType
      ? { usesWheelchair: true, wheelchairType: d.wheelchairType }
      : undefined,
    communication: {
      prefersBSL: d.prefersBSL,
      prefersWriting: d.prefersWriting,
      needsExtraTime: d.needsExtraTime,
    },
  };
}

const STEP_TITLES: Record<Step, string> = {
  1: 'Your primary access need',
  2: 'Mobility aid (if any)',
  3: 'Communication preferences',
  4: 'Emergency contact',
  5: 'Notifications',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const settings = useMemo(() => getSettingsStore(), []);
  const profileStore = useMemo(() => getProfileStore(), []);
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>({});

  const finish = () => {
    try {
      profileStore.upsert(toProfile(draft));
    } catch {
      // Invalid profile shape (e.g. partial contact) — skip the profile write.
    }
    settings.update({ onboardingComplete: true });
    router.replace('/(tabs)/incidents');
  };

  const next = () => {
    if (step === 5) finish();
    else setStep((s) => (s + 1) as Step);
  };

  return (
    <AppShell back={false}>
      <AppHeader
        title="Welcome to AccessMate"
        overline={`Setup — Step ${step} of 5`}
        subtitle="Skip anything you'd rather set up later. You can always come back from Settings."
      />

      <View style={styles.progress}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View key={s} style={[styles.tick, s <= step && styles.tickActive]} />
        ))}
      </View>

      <View style={styles.section}>
        <SectionLabel>{STEP_TITLES[step]}</SectionLabel>

        {step === 1 && (
          <View style={styles.row}>
            <ProfileChip
              label="Blind"
              selected={!!draft.isBlind}
              onToggle={() => setDraft((d) => ({ ...d, isBlind: !d.isBlind }))}
            />
            <ProfileChip
              label="Low vision"
              selected={!!draft.isLowVision}
              onToggle={() => setDraft((d) => ({ ...d, isLowVision: !d.isLowVision }))}
            />
            <ProfileChip
              label="Deaf"
              selected={!!draft.isDeaf}
              onToggle={() => setDraft((d) => ({ ...d, isDeaf: !d.isDeaf }))}
            />
            <ProfileChip
              label="Hard of hearing"
              selected={!!draft.isHardOfHearing}
              onToggle={() => setDraft((d) => ({ ...d, isHardOfHearing: !d.isHardOfHearing }))}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.row}>
            <ProfileChip
              label="Manual wheelchair"
              selected={draft.wheelchairType === 'manual'}
              onToggle={() =>
                setDraft((d) => ({
                  ...d,
                  wheelchairType: d.wheelchairType === 'manual' ? undefined : 'manual',
                }))
              }
            />
            <ProfileChip
              label="Powered wheelchair"
              selected={draft.wheelchairType === 'powered'}
              onToggle={() =>
                setDraft((d) => ({
                  ...d,
                  wheelchairType: d.wheelchairType === 'powered' ? undefined : 'powered',
                }))
              }
            />
            <ProfileChip
              label="Mobility scooter"
              selected={draft.wheelchairType === 'mobility-scooter'}
              onToggle={() =>
                setDraft((d) => ({
                  ...d,
                  wheelchairType:
                    d.wheelchairType === 'mobility-scooter' ? undefined : 'mobility-scooter',
                }))
              }
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.row}>
            <ProfileChip
              label="Prefers BSL"
              selected={!!draft.prefersBSL}
              onToggle={() => setDraft((d) => ({ ...d, prefersBSL: !d.prefersBSL }))}
            />
            <ProfileChip
              label="Prefers writing"
              selected={!!draft.prefersWriting}
              onToggle={() => setDraft((d) => ({ ...d, prefersWriting: !d.prefersWriting }))}
            />
            <ProfileChip
              label="Needs extra time"
              selected={!!draft.needsExtraTime}
              onToggle={() => setDraft((d) => ({ ...d, needsExtraTime: !d.needsExtraTime }))}
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.fields}>
            <TextInput
              placeholder="Name"
              placeholderTextColor={colors.ink.soft}
              accessibilityLabel="Emergency contact name"
              value={draft.contactName ?? ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, contactName: t }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Phone (e.g. +44 7700 900123)"
              placeholderTextColor={colors.ink.soft}
              accessibilityLabel="Emergency contact phone"
              value={draft.contactPhone ?? ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, contactPhone: t }))}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.row}>
            <ProfileChip
              label="Allow reminders (e.g. 8-week escalate)"
              selected={!!draft.notifications}
              onToggle={() => setDraft((d) => ({ ...d, notifications: !d.notifications }))}
            />
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <BigActionButton
          label={step === 5 ? 'Finish' : 'Next'}
          hint={step === 5 ? 'Save your profile and finish setup' : 'Go to the next step'}
          onPress={next}
        />
        <BigActionButton
          label="Skip this step"
          hint="Move to the next step without saving this answer"
          variant="secondary"
          onPress={() => (step === 5 ? finish() : setStep((s) => (s + 1) as Step))}
        />
        <BigActionButton
          label="Set up later"
          hint="Skip onboarding entirely and go to the home screen"
          variant="ghost"
          onPress={() => {
            settings.update({ onboardingComplete: true });
            router.replace('/(tabs)/incidents');
          }}
        />
      </View>

      {step === 5 && <Text style={styles.note}>You can change this any time in Settings.</Text>}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 6, marginTop: space.xs },
  tick: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line.hairline },
  tickActive: { backgroundColor: colors.accent.base },
  section: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  fields: { gap: space.md },
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
  actions: { gap: space.sm, marginTop: space.lg },
  note: { ...type.caption, color: colors.ink.muted, textAlign: 'center' },
});
