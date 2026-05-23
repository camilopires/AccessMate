import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BigActionButton } from '../src/components/BigActionButton';
import { ProfileChip } from '../src/components/ProfileChip';
import { getSettingsStore } from '../src/settings/factory';
import { getProfileStore } from '../src/profile/store';
import type { Profile } from '../src/profile/schemas';

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
    router.replace('/');
  };

  const next = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (step === 5) finish();
    else setStep((s) => (s + 1) as Step);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        Welcome to AccessMate
      </Text>
      <Text style={styles.note}>
        Step {step} of 5. Skip anything you&apos;d rather set up later.
      </Text>

      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Your primary access need
          </Text>
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
        </View>
      )}

      {step === 2 && (
        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Mobility aid (if any)
          </Text>
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
        </View>
      )}

      {step === 3 && (
        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Communication preferences
          </Text>
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
        </View>
      )}

      {step === 4 && (
        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Emergency contact
          </Text>
          <TextInput
            placeholder="Name"
            accessibilityLabel="Emergency contact name"
            value={draft.contactName ?? ''}
            onChangeText={(t) => setDraft((d) => ({ ...d, contactName: t }))}
            style={styles.input}
          />
          <TextInput
            placeholder="Phone (e.g. +44 7700 900123)"
            accessibilityLabel="Emergency contact phone"
            value={draft.contactPhone ?? ''}
            onChangeText={(t) => setDraft((d) => ({ ...d, contactPhone: t }))}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>
      )}

      {step === 5 && (
        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Notifications
          </Text>
          <ProfileChip
            label="Allow reminders (e.g. 8-week escalate)"
            selected={!!draft.notifications}
            onToggle={() => setDraft((d) => ({ ...d, notifications: !d.notifications }))}
          />
          <Text style={styles.note}>You can change this any time in Settings.</Text>
        </View>
      )}

      <View style={styles.actions}>
        <BigActionButton
          label={step === 5 ? 'Finish' : 'Next'}
          hint={step === 5 ? 'Save your profile and finish setup' : 'Go to the next step'}
          onPress={() => next({})}
        />
        <BigActionButton
          label="Skip this step"
          hint="Move to the next step without saving this answer"
          onPress={() => (step === 5 ? finish() : setStep((s) => (s + 1) as Step))}
        />
        <BigActionButton
          label="Set up later"
          hint="Skip onboarding entirely and go to the home screen"
          onPress={() => {
            settings.update({ onboardingComplete: true });
            router.replace('/');
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48, backgroundColor: '#fff', gap: 16 },
  h1: { fontSize: 28, fontWeight: '700', color: '#000' },
  h2: { fontSize: 20, fontWeight: '700', color: '#000' },
  section: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { fontSize: 14, color: '#444' },
  input: {
    borderWidth: 2,
    borderColor: '#1f6feb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
    color: '#000',
  },
  actions: { gap: 8, marginTop: 16 },
});
