import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { ProfileChip } from '../components/ProfileChip';
import { BigActionButton } from '../components/BigActionButton';
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
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1} accessibilityRole="header">
        Your accessibility profile
      </Text>

      <Section title="Mobility">
        <View style={styles.chipRow}>
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
        </View>
      </Section>

      <Section title="Sensory">
        <View style={styles.chipRow}>
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
        </View>
      </Section>

      <Section title="Communication">
        <View style={styles.chipRow}>
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
        </View>
      </Section>

      <Section title="Medical">
        <View style={styles.chipRow}>
          <ProfileChip
            label="Carries EpiPen"
            selected={!!med.carriesEpiPen}
            onToggle={() => onChange({ ...profile, medical: toggle(med, 'carriesEpiPen') })}
          />
        </View>
      </Section>

      <Section title="Emergency contacts">
        <Text style={styles.note} accessibilityRole="text">
          {profile.emergencyContacts && profile.emergencyContacts.length > 0
            ? `${profile.emergencyContacts.length} contact(s) on file`
            : 'No contacts yet.'}
        </Text>
      </Section>

      <View style={styles.saveRow}>
        <BigActionButton
          label="Save profile"
          hint="Stores your profile on this device"
          onPress={onSave}
        />
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 8 },
  h1: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  h2: { fontSize: 20, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  section: { marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { fontSize: 16, color: '#444' },
  saveRow: { marginTop: 16 },
});
