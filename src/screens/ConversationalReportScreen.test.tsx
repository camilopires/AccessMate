import { describe, it, expect, jest } from '@jest/globals';
import { act, render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ConversationalReportScreen } from './ConversationalReportScreen';
import { loadComplaintTemplates } from '../incidents/templates';
import { loadBundledOperators } from '../content/operators';
import type { AppleFmConversationTurn } from '../../modules/apple-fm/src/AppleFm.types';

const templates = loadComplaintTemplates();
const operators = loadBundledOperators();

function deps(turns: AppleFmConversationTurn[]): {
  startConversation: jest.Mock<(sys: string) => Promise<string>>;
  sendMessage: jest.Mock<(id: string, text: string) => Promise<AppleFmConversationTurn>>;
  endConversation: jest.Mock<(id: string) => Promise<void>>;
} {
  let i = 0;
  return {
    startConversation: jest.fn(async () => 'sess-1'),
    sendMessage: jest.fn(async () => {
      const t = turns[i] ?? turns[turns.length - 1];
      i += 1;
      return t;
    }),
    endConversation: jest.fn(async () => {}),
  };
}

describe('ConversationalReportScreen', () => {
  it('shows the assistant greeting after mount', async () => {
    const d = deps([{ assistantText: 'Hi, when did this happen?', isComplete: false }]);
    render(
      <ConversationalReportScreen
        operators={operators}
        templates={templates}
        startConversation={d.startConversation}
        sendMessage={d.sendMessage}
        endConversation={d.endConversation}
        onComplete={() => {}}
        onSwitchToForm={() => {}}
      />,
    );
    await waitFor(() => {
      expect(d.startConversation).toHaveBeenCalledTimes(1);
    });
    // Greeting is rendered as the first assistant bubble.
    await waitFor(() => {
      expect(screen.getByText(/when did this happen/i)).toBeTruthy();
    });
  });

  it('sends user text and renders the assistant reply', async () => {
    const d = deps([
      { assistantText: 'Hi, when?', isComplete: false },
      { assistantText: 'Which operator?', isComplete: false },
    ]);
    render(
      <ConversationalReportScreen
        operators={operators}
        templates={templates}
        startConversation={d.startConversation}
        sendMessage={d.sendMessage}
        endConversation={d.endConversation}
        onComplete={() => {}}
        onSwitchToForm={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/hi, when/i)).toBeTruthy());

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.changeText(input, 'today');
    fireEvent.press(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      expect(d.sendMessage).toHaveBeenCalledWith('sess-1', 'today');
    });
    await waitFor(() => expect(screen.getByText(/which operator/i)).toBeTruthy());
    expect(screen.getByText('today')).toBeTruthy();
  });

  it('calls onComplete with an assembled draft when the model reports isComplete', async () => {
    const d = deps([
      { assistantText: 'Got it.', isComplete: false },
      {
        assistantText: 'All set.',
        isComplete: true,
        facts: {
          whenISO: '2026-05-24T12:00:00Z',
          operatorName: 'Avanti West Coast',
          scenarioId: 'missed-passenger-assist',
          accompanied: false,
        },
      },
    ]);
    const onComplete = jest.fn();
    render(
      <ConversationalReportScreen
        operators={operators}
        templates={templates}
        startConversation={d.startConversation}
        sendMessage={d.sendMessage}
        endConversation={d.endConversation}
        onComplete={onComplete}
        onSwitchToForm={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText(/got it/i)).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText(/type your message/i), 'avanti');
    fireEvent.press(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const call = onComplete.mock.calls[0][0] as {
      templateId: string;
      facts: { operatorName?: string; accompanied?: boolean };
      recipient?: string;
    };
    expect(call.templateId).toBe('missed-passenger-assist');
    expect(call.facts.operatorName).toBe('Avanti West Coast');
    expect(call.facts.accompanied).toBe(false);
    expect(call.recipient).toContain('avantiwestcoast');
    expect(d.endConversation).toHaveBeenCalledWith('sess-1');
  });

  it('Switch to form calls onSwitchToForm with captured facts', async () => {
    const d = deps([
      { assistantText: 'Hi.', isComplete: false, facts: { operatorName: 'Northern' } },
    ]);
    const onSwitchToForm = jest.fn();
    render(
      <ConversationalReportScreen
        operators={operators}
        templates={templates}
        startConversation={d.startConversation}
        sendMessage={d.sendMessage}
        endConversation={d.endConversation}
        onComplete={() => {}}
        onSwitchToForm={onSwitchToForm}
      />,
    );
    await waitFor(() => expect(screen.getByText(/^hi\.$/i)).toBeTruthy());

    // No facts captured yet from the greeting; we send a message that
    // updates the captured facts.
    fireEvent.changeText(screen.getByPlaceholderText(/type your message/i), 'northern');
    fireEvent.press(screen.getByRole('button', { name: /^send$/i }));
    await act(async () => {});

    fireEvent.press(screen.getByRole('button', { name: /switch to form/i }));
    expect(onSwitchToForm).toHaveBeenCalledTimes(1);
    const facts = onSwitchToForm.mock.calls[0][0] as { operatorName?: string };
    expect(facts.operatorName).toBe('Northern');
  });
});
