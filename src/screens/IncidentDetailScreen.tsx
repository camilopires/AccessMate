import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { BigActionButton } from '../components/BigActionButton';
import { GlassSurface } from '../components/GlassSurface';
import { SectionLabel } from '../components/SectionLabel';
import { StatusBadge } from '../incidents/StatusBadge';
import { colors, space, type } from '../theme';
import type { Incident, IncidentEvent } from '../incidents/schemas';

interface Props {
  incident: Incident;
  onEditDraft: () => void;
  onSend: () => void;
  onDiscard: () => void;
  onOperatorReplied: () => void;
  onEscalate: () => void;
  onMarkResolved: () => void;
  onExportPdf: () => void;
  onReopen: () => void;
}

function eventLine(e: IncidentEvent): string {
  const date = e.atISO.slice(0, 10);
  if (e.kind === 'escalated_to_regulator')
    return `${date} — Escalated to ${e.regulator.toUpperCase()}`;
  if (e.kind === 'operator_response') return `${date} — Operator replied`;
  return `${date} — Marked resolved`;
}

export function IncidentDetailScreen({
  incident,
  onEditDraft,
  onSend,
  onDiscard,
  onOperatorReplied,
  onEscalate,
  onMarkResolved,
  onExportPdf,
  onReopen,
}: Props) {
  return (
    <AppShell>
      <AppHeader
        title={incident.title ?? 'Untitled incident'}
        overline={incident.startedAtISO.slice(0, 10)}
      />

      <View style={styles.statusRow}>
        <StatusBadge status={incident.status} />
        {incident.facts?.operatorName && (
          <Text style={styles.meta}>{incident.facts.operatorName}</Text>
        )}
      </View>

      {(incident.sentAtISO || incident.resolvedAtISO || incident.events.length > 0) && (
        <GlassSurface tint="card" cornerRadius={16} style={styles.card}>
          <SectionLabel>Timeline</SectionLabel>
          <View style={styles.timeline}>
            {incident.sentAtISO && (
              <Text style={styles.timelineLine}>
                {incident.sentAtISO.slice(0, 10)} — Sent to {incident.recipient ?? 'operator'}
              </Text>
            )}
            {incident.events.map((e, i) => (
              <Text key={i} style={styles.timelineLine}>
                {eventLine(e)}
              </Text>
            ))}
            {incident.resolvedAtISO &&
              incident.events.every((e) => e.kind !== 'marked_resolved') && (
                <Text style={styles.timelineLine}>
                  {incident.resolvedAtISO.slice(0, 10)} — Resolved
                </Text>
              )}
          </View>
        </GlassSurface>
      )}

      {incident.draftBody && (
        <GlassSurface tint="card" cornerRadius={16} style={styles.card}>
          <SectionLabel>Outgoing letter</SectionLabel>
          <Text style={styles.body}>{incident.draftBody}</Text>
        </GlassSurface>
      )}

      <View style={styles.actions}>
        {incident.status === 'draft' && (
          <>
            <BigActionButton label="Edit draft" hint="Continue the report" onPress={onEditDraft} />
            <BigActionButton label="Send" hint="Send the draft to the operator" onPress={onSend} />
            <BigActionButton
              label="Discard"
              hint="Throw away this draft"
              variant="ghost"
              onPress={onDiscard}
            />
          </>
        )}
        {incident.status === 'in_progress' && (
          <>
            <BigActionButton
              label="Operator replied"
              hint="Paste their reply"
              onPress={onOperatorReplied}
            />
            <BigActionButton
              label="Escalate to regulator"
              hint="Move to escalation"
              variant="secondary"
              onPress={onEscalate}
            />
            <BigActionButton
              label="Mark as resolved"
              hint="Close this incident"
              variant="ghost"
              onPress={onMarkResolved}
            />
          </>
        )}
        {incident.status === 'completed' && (
          <>
            <BigActionButton
              label="Export PDF"
              hint="Save this incident as a printable PDF"
              onPress={onExportPdf}
            />
            <BigActionButton
              label="Re-open"
              hint="Move back to In Progress"
              variant="ghost"
              onPress={onReopen}
            />
          </>
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meta: { ...type.caption, color: colors.ink.muted },
  card: { padding: space.md, gap: space.xs },
  timeline: { gap: 4 },
  timelineLine: { ...type.caption, color: colors.ink.primary },
  body: {
    ...type.body,
    color: colors.ink.primary,
    backgroundColor: colors.bg.sunken,
    padding: space.md,
    borderRadius: 8,
  },
  actions: { gap: space.sm, marginTop: space.lg },
});
