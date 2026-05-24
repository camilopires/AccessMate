import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { IncidentDetailScreen } from './IncidentDetailScreen';
import type { Incident } from '../incidents/schemas';

const baseDraft: Incident = {
  id: 'd1',
  status: 'draft',
  startedAtISO: '2026-05-23T10:00:00Z',
  title: 'Test draft',
  events: [],
};

const baseInProgress: Incident = {
  ...baseDraft,
  status: 'in_progress',
  sentAtISO: '2026-05-23T11:00:00Z',
};

const baseCompleted: Incident = {
  ...baseInProgress,
  status: 'completed',
  resolvedAtISO: '2026-05-30T11:00:00Z',
  events: [{ kind: 'marked_resolved', atISO: '2026-05-30T11:00:00Z' }],
};

const noopHandlers = {
  onEditDraft: () => {},
  onSend: () => {},
  onDiscard: () => {},
  onOperatorReplied: () => {},
  onEscalate: () => {},
  onMarkResolved: () => {},
  onExportPdf: () => {},
  onReopen: () => {},
};

describe('IncidentDetailScreen', () => {
  it('Draft → shows Edit / Send / Discard', () => {
    render(<IncidentDetailScreen incident={baseDraft} {...noopHandlers} />);
    expect(screen.getByRole('button', { name: /edit draft/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^send$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /discard/i })).toBeTruthy();
  });

  it('In Progress → shows Operator replied / Escalate / Mark resolved', () => {
    render(<IncidentDetailScreen incident={baseInProgress} {...noopHandlers} />);
    expect(screen.getByRole('button', { name: /operator replied/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /escalate/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /mark.*resolved/i })).toBeTruthy();
  });

  it('Completed → shows Export PDF / Re-open', () => {
    render(<IncidentDetailScreen incident={baseCompleted} {...noopHandlers} />);
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /re-open/i })).toBeTruthy();
  });

  it('renders timeline entries from events[]', () => {
    const incident: Incident = {
      ...baseInProgress,
      events: [
        {
          kind: 'operator_response',
          atISO: '2026-06-01T10:00:00Z',
          bodyMarkdown: 'We regret to inform you...',
        },
        {
          kind: 'escalated_to_regulator',
          atISO: '2026-07-19T10:00:00Z',
          regulator: 'orr',
          draftBody: 'To the ORR...',
        },
      ],
    };
    render(<IncidentDetailScreen incident={incident} {...noopHandlers} />);
    expect(screen.getByText(/2026-06-01 — Operator replied/)).toBeTruthy();
    expect(screen.getByText(/2026-07-19 — Escalated to ORR/)).toBeTruthy();
  });

  it('button presses fire the right handlers', () => {
    const onSend = jest.fn();
    const onEscalate = jest.fn();
    const { rerender } = render(
      <IncidentDetailScreen incident={baseDraft} {...noopHandlers} onSend={onSend} />,
    );
    fireEvent.press(screen.getByRole('button', { name: /^send$/i }));
    expect(onSend).toHaveBeenCalledTimes(1);

    rerender(
      <IncidentDetailScreen incident={baseInProgress} {...noopHandlers} onEscalate={onEscalate} />,
    );
    fireEvent.press(screen.getByRole('button', { name: /escalate/i }));
    expect(onEscalate).toHaveBeenCalledTimes(1);
  });
});
