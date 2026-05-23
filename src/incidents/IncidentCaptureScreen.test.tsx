import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { IncidentCaptureScreen } from './IncidentCaptureScreen';

const baseProps = {
  incidentId: 'inc-1',
  mediaCount: 0,
  onAttachNote: () => {},
  onTakePhoto: () => {},
  onRecordAudio: () => {},
  onSave: () => {},
  onDiscard: () => {},
};

describe('IncidentCaptureScreen', () => {
  it('renders the heading and primary capture buttons', () => {
    render(<IncidentCaptureScreen {...baseProps} />);
    expect(screen.getByRole('header', { name: /something went wrong/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /add a photo/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /record audio/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /save & finish/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /discard/i })).toBeTruthy();
  });

  it('typing a note and adding it calls onAttachNote with the trimmed text', () => {
    const onAttachNote = jest.fn<(s: string) => void>();
    render(<IncidentCaptureScreen {...baseProps} onAttachNote={onAttachNote} />);
    fireEvent.changeText(screen.getByPlaceholderText(/what happened/i), '  no ramp at door  ');
    fireEvent.press(screen.getByRole('button', { name: /add note/i }));
    expect(onAttachNote).toHaveBeenCalledWith('no ramp at door');
  });

  it('Save & finish passes the summary text to onSave', () => {
    const onSave = jest.fn<(s: string) => void>();
    render(<IncidentCaptureScreen {...baseProps} onSave={onSave} />);
    fireEvent.changeText(screen.getByPlaceholderText(/short summary/i), 'denied boarding');
    fireEvent.press(screen.getByRole('button', { name: /save & finish/i }));
    expect(onSave).toHaveBeenCalledWith('denied boarding');
  });

  it('shows the number of items captured so far', () => {
    render(<IncidentCaptureScreen {...baseProps} mediaCount={3} />);
    expect(screen.getByText(/3 item/i)).toBeTruthy();
  });
});
