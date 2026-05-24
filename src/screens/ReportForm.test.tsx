import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ReportForm } from './ReportForm';
import { loadComplaintTemplates } from '../incidents/templates';
import { loadBundledOperators } from '../content/operators';

const templates = loadComplaintTemplates();
const operators = loadBundledOperators();

describe('ReportForm', () => {
  it('renders step 1 with a date prompt and a Next button', () => {
    render(
      <ReportForm
        operators={operators}
        templates={templates}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('header', { name: /when did this happen/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeTruthy();
  });

  it('walks the 4 steps and calls onComplete with a draft', () => {
    const onComplete =
      jest.fn<
        (draft: {
          title: string;
          facts: { scenarioId?: string; accompanied?: boolean; operatorName?: string };
          templateId: string;
          draftBody: string;
          recipient?: string;
        }) => void
      >();
    render(
      <ReportForm
        operators={operators}
        templates={templates}
        onComplete={onComplete}
        onCancel={() => {}}
      />,
    );
    // Step 1: When? — date defaults to today; Next.
    fireEvent.press(screen.getByRole('button', { name: /^next$/i }));
    // Step 2: Operator — tap Avanti, then Next.
    fireEvent.press(screen.getByText('Avanti West Coast'));
    fireEvent.press(screen.getByRole('button', { name: /^next$/i }));
    // Step 3: Scenario — tap Missed Passenger Assist, then Next.
    fireEvent.press(screen.getByText('Missed Passenger Assist'));
    fireEvent.press(screen.getByRole('button', { name: /^next$/i }));
    // Step 4: Accompanied? — tap Alone, then Draft.
    fireEvent.press(screen.getByText('Alone'));
    fireEvent.press(screen.getByRole('button', { name: /draft/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const draft = onComplete.mock.calls[0][0];
    expect(draft.templateId).toBe('missed-passenger-assist');
    expect(draft.facts.scenarioId).toBe('missed-passenger-assist');
    expect(draft.facts.accompanied).toBe(false);
    expect(draft.facts.operatorName).toBe('Avanti West Coast');
    expect(draft.recipient).toBe('customer.resolutions@avantiwestcoast.co.uk');
    expect(draft.draftBody).toContain('Avanti West Coast');
    expect(draft.title.length).toBeGreaterThan(0);
  });

  it('Cancel button fires onCancel', () => {
    const onCancel = jest.fn();
    render(
      <ReportForm
        operators={operators}
        templates={templates}
        onComplete={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
