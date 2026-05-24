import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { ProfileChip } from '../components/ProfileChip';
import { BigActionButton } from '../components/BigActionButton';
import { SectionLabel } from '../components/SectionLabel';
import { colors, space, type } from '../theme';
import type { Profile } from './schemas';

interface Props {
  profile: Profile;
  onChange: (next: Profile) => void;
  onSave: () => void;
}

function toggle<T extends object>(obj: T | undefined, key: keyof T): T {
  const cur = (obj?.[key] as boolean | undefined) ?? false;
  return { ...(obj as object), [key]: !cur } as T;
}

export function ProfileEditor({ profile, onChange, onSave }: Props) {
  const m = profile.mobility ?? {};
  const s = profile.sensory ?? {};
  const c = profile.communication ?? {};
  const med = profile.medical ?? {};

  return (
    <AppShell>
      <AppHeader title="Your accessibility profile" overline="Edit" />

      <Section title="Mobility">
        <ProfileChip
          label="Uses wheelchair"
          selected={!!m.usesWheelchair}
          onToggle={() => onChange({ ...profile, mobility: toggle(m, 'usesWheelchair') })}
        />
        <ProfileChip
          label="Can transfer"
          selected={!!m.canTransfer}
          onToggle={() => onChange({ ...profile, mobility: toggle(m, 'canTransfer') })}
        />
      </Section>

      <Section title="Sensory">
        <ProfileChip
          label="Blind"
          selected={!!s.isBlind}
          onToggle={() => onChange({ ...profile, sensory: toggle(s, 'isBlind') })}
        />
        <ProfileChip
          label="Low vision"
          selected={!!s.isLowVision}
          onToggle={() => onChange({ ...profile, sensory: toggle(s, 'isLowVision') })}
        />
        <ProfileChip
          label="Deaf"
          selected={!!s.isDeaf}
          onToggle={() => onChange({ ...profile, sensory: toggle(s, 'isDeaf') })}
        />
        <ProfileChip
          label="Hard of hearing"
          selected={!!s.isHardOfHearing}
          onToggle={() => onChange({ ...profile, sensory: toggle(s, 'isHardOfHearing') })}
        />
        <ProfileChip
          label="Guide dog"
          selected={!!s.hasGuideDog}
          onToggle={() => onChange({ ...profile, sensory: toggle(s, 'hasGuideDog') })}
        />
      </Section>

      <Section title="Communication">
        <ProfileChip
          label="Prefers BSL"
          selected={!!c.prefersBSL}
          onToggle={() => onChange({ ...profile, communication: toggle(c, 'prefersBSL') })}
        />
        <ProfileChip
          label="Prefers writing"
          selected={!!c.prefersWriting}
          onToggle={() => onChange({ ...profile, communication: toggle(c, 'prefersWriting') })}
        />
        <ProfileChip
          label="Needs extra time"
          selected={!!c.needsExtraTime}
          onToggle={() => onChange({ ...profile, communication: toggle(c, 'needsExtraTime') })}
        />
      </Section>

      <Section title="Medical">
        <ProfileChip
          label="Carries EpiPen"
          selected={!!med.carriesEpiPen}
          onToggle={() => onChange({ ...profile, medical: toggle(med, 'carriesEpiPen') })}
        />
      </Section>

      <View style={styles.notesSection}>
        <SectionLabel>Emergency contacts</SectionLabel>
        <Text style={styles.note} accessibilityRole="text">
          {profile.emergencyContacts && profile.emergencyContacts.length > 0
            ? `${profile.emergencyContacts.length} contact(s) on file`
            : 'No contacts yet.'}
        </Text>
      </View>

      <View style={styles.saveRow}>
        <BigActionButton
          label="Save profile"
          hint="Stores your profile on this device"
          onPress={onSave}
        />
      </View>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionLabel>{title}</SectionLabel>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.xs },
  notesSection: { gap: space.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { ...type.body, color: colors.ink.muted },
  saveRow: { marginTop: space.lg },
});
