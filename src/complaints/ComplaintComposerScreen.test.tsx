import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ComplaintComposerScreen } from './ComplaintComposerScreen';
import { loadComplaintTemplates } from './templates';

const templates = loadComplaintTemplates();

const baseProps = {
  templates,
  selectedTemplateId: null as string | null,
  onSelectTemplate: () => {},
  draftText: '',
  onChangeDraft: () => {},
  onSendEmail: () => {},
  onCopy: () => {},
  onExportPdf: () => {},
};

describe('ComplaintComposerScreen', () => {
  it('shows a chooser when no template is selected', () => {
    render(<ComplaintComposerScreen {...baseProps} />);
    expect(screen.getByRole('header', { name: /compose complaint/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /missed passenger assist/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /taxi refusal/i })).toBeTruthy();
  });

  it('selecting a template calls onSelectTemplate with the id', () => {
    const onSelectTemplate = jest.fn<(id: string) => void>();
    render(<ComplaintComposerScreen {...baseProps} onSelectTemplate={onSelectTemplate} />);
    fireEvent.press(screen.getByRole('button', { name: /missed passenger assist/i }));
    expect(onSelectTemplate).toHaveBeenCalledWith('missed-passenger-assist');
  });

  it('renders the editable draft when a template is selected', () => {
    render(
      <ComplaintComposerScreen
        {...baseProps}
        selectedTemplateId="missed-passenger-assist"
        draftText="# Missed Passenger Assist\n\nHello"
      />,
    );
    expect(screen.getByDisplayValue(/Missed Passenger Assist/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /send by email/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeTruthy();
  });

  it('output buttons fire their callbacks', () => {
    const onSendEmail = jest.fn();
    const onCopy = jest.fn();
    const onExportPdf = jest.fn();
    render(
      <ComplaintComposerScreen
        {...baseProps}
        selectedTemplateId="taxi-refusal"
        draftText="x"
        onSendEmail={onSendEmail}
        onCopy={onCopy}
        onExportPdf={onExportPdf}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: /send by email/i }));
    fireEvent.press(screen.getByRole('button', { name: /copy to clipboard/i }));
    fireEvent.press(screen.getByRole('button', { name: /export pdf/i }));
    expect(onSendEmail).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onExportPdf).toHaveBeenCalledTimes(1);
  });
});
