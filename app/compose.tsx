import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ComplaintComposerScreen } from '../src/complaints/ComplaintComposerScreen';
import { loadComplaintTemplates, getComplaintTemplate } from '../src/complaints/templates';
import { assembleDraft } from '../src/complaints/assemble';
import {
  buildMailtoUrl,
  copyComplaint,
  exportComplaintPdf,
  openComplaintMailto,
} from '../src/complaints/outputs';
import { getIncidentStore } from '../src/incidents/factory';
import { getProfileStore } from '../src/profile/store';
import { loadBundledOperators } from '../src/content/operators';
import { getComplaintStore } from '../src/complaints/factory';
import type { Profile } from '../src/profile/schemas';

export default function ComposeRoute() {
  const { incidentId } = useLocalSearchParams<{ incidentId?: string }>();
  const templates = useMemo(() => loadComplaintTemplates(), []);
  const incidentStore = useMemo(() => getIncidentStore(), []);
  const profileStore = useMemo(() => getProfileStore(), []);
  const complaintStore = useMemo(() => getComplaintStore(), []);
  const operators = useMemo(() => loadBundledOperators(), []);

  const incident = useMemo(
    () => (incidentId ? incidentStore.get(incidentId) : null),
    [incidentId, incidentStore],
  );
  const profile: Profile = useMemo(
    () => profileStore.get() ?? { emergencyContacts: [] },
    [profileStore],
  );
  const mediaSummaries = useMemo(
    () =>
      incident
        ? incidentStore.mediaFor(incident.id).map((m) => {
            if (m.kind === 'note') return `Note: ${m.textBody}`;
            return `${m.kind === 'photo' ? 'Photo' : 'Audio'} attached`;
          })
        : [],
    [incident, incidentStore],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');

  const selectedTemplate = selectedId ? getComplaintTemplate(selectedId) : null;
  const operator = incident?.operatorId
    ? operators.find((o) => o.id === incident.operatorId)
    : undefined;

  const onSelectTemplate = (id: string) => {
    const tpl = getComplaintTemplate(id);
    if (!tpl) return;
    setSelectedId(id);
    if (incident) {
      setDraft(
        assembleDraft({
          incident,
          profile,
          template: tpl,
          operatorName: operator?.name,
          mediaSummaries,
        }),
      );
    } else {
      setDraft(
        `# ${tpl.title}\n\n${tpl.header}\n\n## Legal context\n\n${tpl.legalParagraph}\n\n## What I want\n\n${tpl.ask}\n`,
      );
    }
  };

  const recipient = operator?.complaintsRoute.primaryEmail ?? '';

  return (
    <ComplaintComposerScreen
      templates={templates}
      selectedTemplateId={selectedId}
      onSelectTemplate={onSelectTemplate}
      draftText={draft}
      onChangeDraft={setDraft}
      onSendEmail={() => {
        if (!selectedTemplate) return;
        if (incident) {
          complaintStore.create({
            incidentId: incident.id,
            templateId: selectedTemplate.id,
            recipient,
            regulator: selectedTemplate.regulator,
            bodyMarkdown: draft,
          });
        }
        const subject = selectedTemplate.emailSubject.replace(
          /\{\{date\}\}/g,
          incident?.startedAtISO.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        );
        openComplaintMailto({ to: recipient, subject, body: draft }).catch(() => {
          Alert.alert(
            'Could not open email app',
            buildMailtoUrl({ to: recipient, subject, body: draft }),
          );
        });
      }}
      onCopy={() => {
        copyComplaint(draft).catch(() => Alert.alert('Could not copy', 'Clipboard access failed.'));
      }}
      onExportPdf={() => {
        exportComplaintPdf(draft).catch(() => Alert.alert('Could not export PDF', 'Print failed.'));
      }}
    />
  );
}
