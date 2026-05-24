import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { BigActionButton } from '../components/BigActionButton';
import { GlassSurface } from '../components/GlassSurface';
import { SectionLabel } from '../components/SectionLabel';
import { colors, space, type } from '../theme';
import type { Profile } from './schemas';

interface Props {
  profile: Profile;
  onEdit: () => void;
  onExport: () => void;
}

function isEmpty(p: Profile): boolean {
  return (
    !p.mobility &&
    !p.sensory &&
    !p.communication &&
    !p.medical &&
    !p.blueBadge &&
    !p.notes &&
    (!p.emergencyContacts || p.emergencyContacts.length === 0)
  );
}

function describeWheelchairType(t?: string): string | null {
  if (t === 'powered') return 'Powered wheelchair';
  if (t === 'manual') return 'Manual wheelchair';
  if (t === 'mobility-scooter') return 'Mobility scooter';
  return null;
}

function describeBattery(p: Profile): string | null {
  const b = p.mobility?.battery;
  if (!b) return null;
  const parts: string[] = [];
  if (b.chemistry === 'lithium-ion') parts.push('lithium-ion');
  else if (b.chemistry === 'lithium-iron-phosphate') parts.push('lithium iron phosphate (LiFePO4)');
  else if (b.chemistry === 'sealed-lead-acid') parts.push('sealed lead-acid');
  else if (b.chemistry === 'gel-cell') parts.push('gel cell');
  else if (b.chemistry === 'wet-cell') parts.push('wet cell');
  else if (b.chemistry === 'dry-cell') parts.push('dry cell');
  else if (b.chemistry === 'other') parts.push('other');
  if (b.wattHours != null) parts.push(`${b.wattHours} Wh`);
  if (b.isDryCell) parts.push('dry cell');
  if (b.isSpillable) parts.push('spillable');
  return `Battery: ${parts.join(', ')}`;
}

export function PassportView({ profile, onEdit, onExport }: Props) {
  if (isEmpty(profile)) {
    return (
      <AppShell>
        <AppHeader title="Accessibility passport" overline="Show staff" />
        <GlassSurface tint="card" cornerRadius={16} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Set up your passport</Text>
          <Text style={styles.emptyBody}>
            Staff can see your access needs at a glance. Takes about 90 seconds and stays on your
            device.
          </Text>
          <BigActionButton
            label="Set up passport"
            hint="Fill in your accessibility profile"
            onPress={onEdit}
          />
          <Text style={styles.emptyCaption}>You can skip anything and come back later.</Text>
        </GlassSurface>
      </AppShell>
    );
  }

  const m = profile.mobility;
  const s = profile.sensory;
  const c = profile.communication;
  const med = profile.medical;
  const bb = profile.blueBadge;

  return (
    <AppShell>
      <AppHeader title="Accessibility passport" overline="Show staff" />

      {m && (
        <Section title="Mobility">
          {describeWheelchairType(m.wheelchairType) && (
            <Fact text={describeWheelchairType(m.wheelchairType)!} />
          )}
          {describeBattery(profile) && <Fact text={describeBattery(profile)!} />}
          {m.weightKg != null && <Fact text={`Weight (with chair): ${m.weightKg} kg`} />}
          {m.canTransfer === true && <Fact text="Can transfer from chair" />}
          {m.canTransfer === false && <Fact text="Cannot transfer from chair" />}
        </Section>
      )}

      {s && (
        <Section title="Sensory">
          {s.isBlind && <Fact text="Blind" />}
          {s.isLowVision && <Fact text="Low vision" />}
          {s.isDeaf && <Fact text="Deaf" />}
          {s.isHardOfHearing && <Fact text="Hard of hearing" />}
          {s.hasGuideDog && <Fact text="Travelling with a guide dog" />}
          {s.hasAssistanceDog && <Fact text="Travelling with an assistance dog" />}
        </Section>
      )}

      {c && (
        <Section title="Communication">
          {c.prefersBSL && <Fact text="Prefers British Sign Language" />}
          {c.prefersWriting && <Fact text="Prefers written communication" />}
          {c.prefersSpeech && <Fact text="Prefers spoken communication" />}
          {c.needsExtraTime && <Fact text="Needs extra time when speaking or reading" />}
          {c.notes && <Fact text={c.notes} />}
        </Section>
      )}

      {med && (
        <Section title="Medical">
          {med.carriesEpiPen && <Fact text="Carries EpiPen" />}
          {med.conditions && med.conditions.length > 0 && (
            <Fact text={`Conditions: ${med.conditions.join(', ')}`} />
          )}
          {med.allergies && med.allergies.length > 0 && (
            <Fact text={`Allergies: ${med.allergies.join(', ')}`} />
          )}
          {med.medications && med.medications.length > 0 && (
            <Fact text={`Medications: ${med.medications.map((x) => x.name).join(', ')}`} />
          )}
          {med.notes && <Fact text={med.notes} />}
        </Section>
      )}

      {bb && (
        <Section title="Blue Badge">
          {bb.holder ? (
            <Fact text="UK Blue Badge holder" />
          ) : (
            <Fact text="Not a Blue Badge holder" />
          )}
          {bb.number && <Fact text={`Badge number: ${bb.number}`} />}
          {bb.expiryISO && <Fact text={`Expires: ${bb.expiryISO}`} />}
        </Section>
      )}

      {profile.emergencyContacts && profile.emergencyContacts.length > 0 && (
        <Section title="Emergency contacts">
          {profile.emergencyContacts.map((ec, i) => (
            <Fact
              key={i}
              text={`${ec.name}${ec.relationship ? ` (${ec.relationship})` : ''} — ${ec.phone}`}
            />
          ))}
        </Section>
      )}

      {profile.notes && (
        <Section title="Notes">
          <Fact text={profile.notes} />
        </Section>
      )}

      <View style={styles.actions}>
        <BigActionButton
          label="Edit profile"
          hint="Update your accessibility profile"
          variant="secondary"
          onPress={onEdit}
        />
        <BigActionButton
          label="Export PDF"
          hint="Open a print-ready PDF of this passport"
          onPress={onExport}
        />
      </View>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassSurface tint="card" cornerRadius={16} style={styles.section}>
      <SectionLabel>{title}</SectionLabel>
      <View style={styles.factList}>{children}</View>
    </GlassSurface>
  );
}

function Fact({ text }: { text: string }) {
  return (
    <Text style={styles.fact} accessibilityRole="text">
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  empty: { ...type.body, color: colors.ink.muted, marginVertical: space.md },
  emptyCard: { padding: space.lg, gap: space.md },
  emptyTitle: { ...type.title, color: colors.ink.primary },
  emptyBody: { ...type.body, color: colors.ink.primary },
  emptyCaption: { ...type.caption, color: colors.ink.muted },
  section: { gap: space.xs, padding: space.md },
  factList: { gap: space.xs },
  fact: { ...type.body, color: colors.ink.primary, fontSize: 18, lineHeight: 26 },
  actions: { gap: space.sm, marginTop: space.xl },
});
