import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ShareComposerScreen } from './ShareComposerScreen';

describe('ShareComposerScreen', () => {
  it('renders the four platform chips and a default open-share button', () => {
    render(<ShareComposerScreen initialText="Hello" onOpenShare={() => {}} />);
    expect(screen.getByRole('switch', { name: /^x$/i })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /bluesky/i })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /threads/i })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /instagram/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /open in/i })).toBeTruthy();
  });

  it('shows the live preview, sized to the selected platform', () => {
    render(<ShareComposerScreen initialText={'a'.repeat(400)} onOpenShare={() => {}} />);
    // Default platform is 'x' (280 chars)
    const preview = screen.getByTestId('share-preview');
    expect(preview.props.children.length).toBe(280);
  });

  it('redacts operator name when the toggle is on', () => {
    render(
      <ShareComposerScreen
        initialText="On Avanti West Coast they refused"
        operatorName="Avanti West Coast"
        onOpenShare={() => {}}
      />,
    );
    fireEvent.press(screen.getByRole('switch', { name: /mask operator name/i }));
    const preview = screen.getByTestId('share-preview');
    expect(preview.props.children).toContain('[operator]');
  });

  it('open share calls onOpenShare with the sized, redacted text and platform', () => {
    const onOpenShare = jest.fn<(platform: string, text: string) => void>();
    render(
      <ShareComposerScreen
        initialText="Refused boarding"
        operatorName="Avanti"
        onOpenShare={onOpenShare}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: /open in/i }));
    expect(onOpenShare).toHaveBeenCalledTimes(1);
    expect(onOpenShare.mock.calls[0][0]).toBe('x');
  });
});
